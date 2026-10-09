const prisma = require('../db/prismaClient');
const { createAlert, createUrgencyEscalationAlert } = require('./alertService');
const { logDonorRegistered } = require('./auditLogger');

class LiveSimulationService {
  constructor() {
    this.io = null;
    this.timer = null;
    this.isRunning = true; // Active by default
    this.intervalMs = 20000; // 20 seconds between autonomous events
    this.lastEvent = null;
    this.eventLog = [];

    this.donorNames = [
      'Vikramaditya Rao', 'Meenakshi Sundaram', 'Tushar Kulkarni', 
      'Pooja Nair', 'Rohan Sengupta', 'Deepika Varma', 'Arjun Kapoor',
      'Ananya Bhattacharya', 'Kavita Deshmukh', 'Farhan Merchant',
      'Siddharth Malhotra', 'Simran Kaur', 'Aditi Mukherjee', 'Harsh Vardhan'
    ];

    this.organs = ['Kidney', 'Liver', 'Heart', 'Lung', 'Cornea'];
    this.bloodGroups = ['O+', 'O-', 'A+', 'B+', 'B-', 'A-', 'AB+'];
    this.hlaPool = [
      ['A*02:01', 'A*24:02', 'B*40:01', 'B*51:01', 'DRB1*15:01'],
      ['A*01:01', 'A*03:01', 'B*07:02', 'B*08:01', 'DRB1*03:01'],
      ['A*11:01', 'A*33:03', 'B*44:03', 'B*57:01', 'DRB1*07:01'],
      ['A*02:06', 'A*31:01', 'B*15:01', 'B*35:01', 'DRB1*04:05']
    ];
  }

  init(socketIo) {
    this.io = socketIo;
    if (this.isRunning && !this.timer) {
      this.startSimulation();
    }
  }

  startSimulation(intervalMs = this.intervalMs) {
    this.intervalMs = intervalMs;
    this.isRunning = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.triggerNextEvent(), this.intervalMs);
    console.log(`📡 [LiveSimulation] Autonomous hospital telemetry daemon started (${this.intervalMs / 1000}s interval)`);
  }

  stopSimulation() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('📡 [LiveSimulation] Autonomous daemon paused');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      lastEvent: this.lastEvent,
      totalEvents: this.eventLog.length,
      history: this.eventLog.slice(0, 10),
    };
  }

  async triggerNextEvent() {
    try {
      const types = ['DONOR_DECLARED', 'URGENCY_ESCALATION', 'TRANSIT_TELEMETRY', 'TRANSIT_TELEMETRY'];
      const pick = types[Math.floor(Math.random() * types.length)];
      return await this.triggerSpecificEvent(pick);
    } catch (err) {
      console.error('[LiveSimulation] Failed to execute simulation event:', err.message);
    }
  }

  async triggerSpecificEvent(type) {
    const hospitals = await prisma.hospital.findMany();
    if (!hospitals || hospitals.length === 0) return null;

    let eventRecord = null;

    if (type === 'DONOR_DECLARED') {
      const hospital = hospitals[Math.floor(Math.random() * hospitals.length)];
      const name = this.donorNames[Math.floor(Math.random() * this.donorNames.length)] + ' (Sim)';
      const organType = this.organs[Math.floor(Math.random() * this.organs.length)];
      const bloodGroup = this.bloodGroups[Math.floor(Math.random() * this.bloodGroups.length)];
      const hla = this.hlaPool[Math.floor(Math.random() * this.hlaPool.length)];

      const donor = await prisma.donor.create({
        data: {
          name,
          age: Math.floor(Math.random() * 42) + 20,
          bloodGroup,
          organType,
          hlaType: JSON.stringify(hla),
          hospitalId: hospital.id,
          consentStatus: 'Consented',
          isAvailable: true,
          donorRiskIndex: +(1.05 + Math.random() * 0.4).toFixed(2),
          causeOfDeath: 'Trauma ICU (Brain Death Declared)',
          donorDeceasedAt: new Date(),
        },
        include: { hospital: true },
      });

      // Audit and alert
      await logDonorRegistered(donor);
      await createAlert({
        type: 'NewMatch',
        message: `🚨 ORGAN PROCUREMENT: Brain death declared at ${hospital.name} (${hospital.city}). ${organType} [${bloodGroup}] entered matching pool.`,
        donorId: donor.id,
        io: this.io,
      });

      if (this.io) {
        this.io.emit('donor:registered', donor);
      }

      eventRecord = {
        id: `EVT-${Date.now()}`,
        type: 'DONOR_DECLARED',
        title: `Organ Available: ${organType} (${bloodGroup})`,
        location: `${hospital.name}, ${hospital.city}`,
        message: `Donor ${name} entered active allocation pool. CIT timer initialized.`,
        timestamp: new Date().toISOString(),
        severity: 'critical',
      };

    } else if (type === 'URGENCY_ESCALATION') {
      const waiting = await prisma.recipient.findMany({
        where: { status: 'Waiting' },
        include: { hospital: true },
        take: 30,
      });

      if (waiting.length > 0) {
        const candidate = waiting[Math.floor(Math.random() * waiting.length)];
        const oldScore = candidate.severityScore || 5;
        const newScore = Math.min(10, Math.max(7.5, +(oldScore + 1.2).toFixed(1)));

        await prisma.recipient.update({
          where: { id: candidate.id },
          data: { severityScore: newScore },
        });

        await createUrgencyEscalationAlert({
          recipientId: candidate.id,
          recipientName: candidate.name,
          oldTier: `MELD/Urgency ${oldScore.toFixed(1)}`,
          newTier: `MELD/Urgency ${newScore.toFixed(1)}`,
          io: this.io,
        });

        if (this.io) {
          this.io.emit('recipient:escalated', {
            id: candidate.id,
            name: candidate.name,
            organ: candidate.organTypeNeeded,
            hospital: candidate.hospital?.name,
            city: candidate.hospital?.city,
            severityScore: newScore,
          });
        }

        eventRecord = {
          id: `EVT-${Date.now()}`,
          type: 'URGENCY_ESCALATION',
          title: `Clinical Escalation: ${candidate.name}`,
          location: `${candidate.hospital?.name || 'Regional Center'}, ${candidate.hospital?.city || 'India'}`,
          message: `${candidate.organTypeNeeded} recipient severity escalated to ${newScore}/10. Priority queue updated.`,
          timestamp: new Date().toISOString(),
          severity: 'warning',
        };
      }

    } else if (type === 'TRANSIT_TELEMETRY') {
      const h1 = hospitals[Math.floor(Math.random() * hospitals.length)];
      let h2 = hospitals[Math.floor(Math.random() * hospitals.length)];
      while (h1.id === h2.id && hospitals.length > 1) {
        h2 = hospitals[Math.floor(Math.random() * hospitals.length)];
      }

      const flightNo = `MED-AIR-${Math.floor(Math.random() * 800 + 100)}`;
      const organ = this.organs[Math.floor(Math.random() * this.organs.length)];
      const speed = Math.floor(Math.random() * 80 + 380); // km/h
      const remainingMinutes = Math.floor(Math.random() * 45 + 18);

      const transitData = {
        flightNo,
        organ,
        origin: h1.city,
        originHospital: h1.name,
        destination: h2.city,
        destinationHospital: h2.name,
        speedKmh: speed,
        altitudeFt: 16500,
        etaMinutes: remainingMinutes,
        mode: 'Air Ambulance Green Corridor',
        citPreservation: 'Optimal Hypothermic (4°C)',
      };

      if (this.io) {
        this.io.emit('transit:telemetry', transitData);
      }

      eventRecord = {
        id: `EVT-${Date.now()}`,
        type: 'TRANSIT_TELEMETRY',
        title: `Green Corridor In-Flight: ${organ}`,
        location: `${h1.city} ✈️ ${h2.city}`,
        message: `${flightNo} transporting ${organ} to ${h2.name}. ETA ${remainingMinutes}m. Perfusion stable.`,
        timestamp: new Date().toISOString(),
        severity: 'info',
      };
    }

    if (eventRecord) {
      this.lastEvent = eventRecord;
      this.eventLog.unshift(eventRecord);
      if (this.eventLog.length > 30) this.eventLog.pop();

      if (this.io) {
        this.io.emit('simulation:event', eventRecord);
      }
    }

    return eventRecord;
  }
}

const liveSimulationService = new LiveSimulationService();
module.exports = liveSimulationService;
