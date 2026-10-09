const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { isBloodCompatible } = require('../src/services/bloodCompatibility');
const { computeHlaMatchScore } = require('../src/services/hlaMatching');
const { haversineDistance } = require('../src/services/geoSearch');
const { computeUrgencyScore } = require('../src/services/urgencyScoring');
const { computeOverallScore } = require('../src/services/compatibilityEngine');
const { computeDonorRiskIndex } = require('../src/services/donorRiskIndex');
const { computeSurvivalScore } = require('../src/services/survivalScore');
const { estimateCitHours, isCitExceeded } = require('../src/config/citLimits');
const bcrypt = require('bcryptjs');

const BLOOD_GROUPS  = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const ORGAN_TYPES   = ['Kidney','Liver','Heart','Lung','Pancreas','Cornea'];
const CAUSES        = ['Trauma','Stroke','CardiacArrest','Other'];
const HLA_MARKERS   = ['A1','A2','A3','A11','A24','B7','B8','B27','B35','B44','DR3','DR4','DR7','DR11','DR15','DQ2','DQ7','DQ8'];
const FIRST_NAMES   = ['Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Ayaan','Krishna','Ishaan','Shaurya','Ananya','Sana','Diya','Priya','Neha','Kavya','Isha','Riya','Aisha','Rahul','Vikram','Suresh','Ramesh','Karthik','Divya','Pooja','Anjali','Amit','Raj','Sanjay'];
const LAST_NAMES    = ['Sharma','Verma','Gupta','Malhotra','Singh','Patel','Shah','Kumar','Reddy','Rao','Iyer','Nair','Menon','Das','Bose','Mukherjee','Banerjee','Chatterjee','Yadav','Joshi','Desai','Mehta','Chauhan','Pandey','Mishra','Tiwari'];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const randName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
const randHla  = () => { const s = new Set(); while (s.size < rand(3,6)) s.add(pick(HLA_MARKERS)); return Array.from(s); };

async function main() {
  console.log('🌱 Seeding VitalNode v2 database...');

  // Clear all tables in dependency order
  await prisma.exchangeLeg.deleteMany({});
  await prisma.exchangeCycle.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.transplant.deleteMany({});
  await prisma.compatibilityMatch.deleteMany({});
  await prisma.hlaAntigen.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.donor.deleteMany({});
  await prisma.recipient.deleteMany({});
  await prisma.hospital.deleteMany({});

  // ── Hospitals ────────────────────────────────────────────────────────────
  console.log('🏥 Creating 15 hospitals...');
  const hospitalData = [
    { name: 'AIIMS',                city: 'New Delhi',      latitude: 28.5659, longitude: 77.2069, contactInfo: 'contact@aiims.edu'       },
    { name: 'Apollo Hospitals',     city: 'Chennai',        latitude: 13.0604, longitude: 80.2496, contactInfo: 'info@apollo.in'           },
    { name: 'Fortis Hospital',      city: 'Mumbai',         latitude: 19.1417, longitude: 72.9372, contactInfo: 'care@fortis.in'           },
    { name: 'Manipal Hospital',     city: 'Bengaluru',      latitude: 12.9592, longitude: 77.6443, contactInfo: 'help@manipal.org'         },
    { name: 'KIMS',                 city: 'Hyderabad',      latitude: 17.4410, longitude: 78.4862, contactInfo: 'info@kims.com'            },
    { name: 'CMC Vellore',          city: 'Vellore',        latitude: 12.9244, longitude: 79.1353, contactInfo: 'contact@cmcvellore.ac.in' },
    { name: 'PGI Chandigarh',       city: 'Chandigarh',     latitude: 30.7628, longitude: 76.7725, contactInfo: 'pgi@chd.nic.in'          },
    { name: 'Max Super Speciality', city: 'New Delhi',      latitude: 28.5273, longitude: 77.2089, contactInfo: 'max@saket.in'            },
    { name: 'Lilavati Hospital',    city: 'Mumbai',         latitude: 19.0511, longitude: 72.8279, contactInfo: 'info@lilavati.com'        },
    { name: 'Aster Medcity',        city: 'Kochi',          latitude: 10.0573, longitude: 76.2848, contactInfo: 'info@aster.com'          },
    { name: 'Medanta',              city: 'Gurugram',       latitude: 28.4326, longitude: 77.0422, contactInfo: 'info@medanta.org'         },
    { name: 'Tata Memorial',        city: 'Mumbai',         latitude: 19.0048, longitude: 72.8427, contactInfo: 'tata@tmc.gov.in'         },
    { name: 'Sankara Nethralaya',   city: 'Chennai',        latitude: 13.0645, longitude: 80.2435, contactInfo: 'info@sankara.in'         },
    { name: 'Narayana Health',      city: 'Bengaluru',      latitude: 12.8093, longitude: 77.6974, contactInfo: 'contact@narayana.in'     },
    { name: 'Ruby Hall Clinic',     city: 'Pune',           latitude: 18.5332, longitude: 73.8761, contactInfo: 'info@rubyhall.com'       },
  ];
  const hospitals = [];
  for (const h of hospitalData) hospitals.push(await prisma.hospital.create({ data: h }));

  // ── Users (RBAC) ─────────────────────────────────────────────────────────
  console.log('👤 Creating default users...');
  const users = [
    { username: 'admin',       password: 'admin123',       role: 'Admin'       },
    { username: 'coordinator', password: 'coord123',       role: 'Coordinator' },
    { username: 'surgeon',     password: 'surgeon123',     role: 'Surgeon'     },
    { username: 'auditor',     password: 'auditor123',     role: 'Auditor'     },
  ];
  for (const u of users) {
    await prisma.user.create({ data: { username: u.username, passwordHash: await bcrypt.hash(u.password, 10), role: u.role } });
  }
  console.log('   Default logins: admin/admin123, coordinator/coord123, surgeon/surgeon123, auditor/auditor123');

  // ── Donors ───────────────────────────────────────────────────────────────
  console.log('🫀 Creating 150 donors...');
  const donors = [];
  const hlaAntigens = [];

  for (let i = 0; i < 150; i++) {
    const age = rand(18, 72);
    const cause = pick(CAUSES);
    const hla = randHla();
    const consent = rand(1,10) > 2 ? 'Consented' : pick(['Pending','Revoked']);
    const dri = computeDonorRiskIndex({ age, causeOfDeath: cause });
    const deceasedAt = rand(1,3) === 1 ? new Date(Date.now() - rand(1,48)*3600000) : null;

    const d = await prisma.donor.create({
      data: {
        name: randName(), age,
        bloodGroup: pick(BLOOD_GROUPS),
        organType:  pick(ORGAN_TYPES),
        hlaType: JSON.stringify(hla),
        hospitalId: pick(hospitals).id,
        consentStatus: consent,
        isAvailable: consent === 'Consented' && rand(1,10) > 2,
        causeOfDeath: cause,
        donorDeceasedAt: deceasedAt,
        donorRiskIndex: dri,
      },
    });
    donors.push(d);
    for (const code of hla) hlaAntigens.push({ entityType: 'Donor', antigenCode: code, donorId: d.id });
  }

  // ── Recipients ───────────────────────────────────────────────────────────
  console.log('🏥 Creating 200 recipients...');
  const recipients = [];
  for (let i = 0; i < 200; i++) {
    const hla = randHla();
    const r = await prisma.recipient.create({
      data: {
        name: randName(), age: rand(5, 78),
        bloodGroup: pick(BLOOD_GROUPS),
        organTypeNeeded: pick(ORGAN_TYPES),
        hlaType: JSON.stringify(hla),
        hospitalId: pick(hospitals).id,
        severityScore: rand(3, 10),
        waitTimeDays: rand(10, 900),
        priorFailedMatches: rand(1,10) > 8 ? rand(1,3) : 0,
        status: 'Waiting',
      },
    });
    recipients.push(r);
    for (const code of hla) hlaAntigens.push({ entityType: 'Recipient', antigenCode: code, recipientId: r.id });
  }

  // Bulk-insert HLA antigens
  console.log(`🧬 Inserting ${hlaAntigens.length} HLA antigen records...`);
  await prisma.hlaAntigen.createMany({ data: hlaAntigens });

  // ── Compatibility Matches ─────────────────────────────────────────────────
  console.log('🔬 Computing compatibility matches...');
  const allDonors     = await prisma.donor.findMany({ include: { hospital: true } });
  const allRecipients = await prisma.recipient.findMany({ include: { hospital: true } });

  let matchCount = 0;
  for (const donor of allDonors) {
    if (donor.consentStatus !== 'Consented') continue;
    const candidates = allRecipients.filter(r => r.organTypeNeeded === donor.organType && r.status === 'Waiting');

    for (const recipient of candidates) {
      if (!isBloodCompatible(donor.bloodGroup, recipient.bloodGroup)) continue;
      const { score: hlaScore } = computeHlaMatchScore(donor.hlaType, recipient.hlaType);
      const distKm = haversineDistance(donor.hospital.latitude, donor.hospital.longitude, recipient.hospital.latitude, recipient.hospital.longitude);
      const { urgencyScore } = computeUrgencyScore(recipient);
      const overall = computeOverallScore({ bloodCompatible: true, hlaMatchScore: hlaScore, organTypeMatch: true, distanceKm: distKm });
      if (overall <= 50) continue;

      const citHours  = estimateCitHours(distKm);
      const exceeded  = isCitExceeded(distKm, donor.organType);
      const survival  = computeSurvivalScore({ hlaMatchScore: hlaScore, coldIschemicTimeHours: citHours, recipientAge: recipient.age, priorFailedMatches: recipient.priorFailedMatches });
      const status    = exceeded ? 'Rejected' : 'Candidate';

      await prisma.compatibilityMatch.create({
        data: {
          donorId: donor.id, recipientId: recipient.id,
          bloodCompatible: true, hlaMatchScore: hlaScore, organTypeMatch: true,
          distanceKm: distKm, urgencyScore, overallCompatibilityScore: overall,
          coldIschemicTimeHours: citHours, predictedGraftSurvival5yr: survival,
          citExceeded: exceeded, matchStatus: status,
        },
      });
      matchCount++;
    }
  }
  console.log(`   ✅ ${matchCount} match edges created`);

  // ── Historical Transplants ────────────────────────────────────────────────
  console.log('💉 Creating 20 historical transplants...');
  const topMatches = await prisma.compatibilityMatch.findMany({
    where: { matchStatus: 'Candidate', citExceeded: false },
    orderBy: { overallCompatibilityScore: 'desc' },
    take: 20,
    include: { donor: true, recipient: true },
  });

  let txCount = 0;
  for (const m of topMatches) {
    const dr = await prisma.donor.findUnique({ where: { id: m.donorId } });
    const rc = await prisma.recipient.findUnique({ where: { id: m.recipientId } });
    if (!dr.isAvailable || rc.status !== 'Waiting') continue;
    const outcome = pick(['Success','Success','Success','Pending','Failed']);
    await prisma.compatibilityMatch.update({ where: { id: m.id }, data: { matchStatus: 'Finalized' } });
    await prisma.donor.update({ where: { id: m.donorId }, data: { isAvailable: false } });
    const rStatus = outcome === 'Success' ? 'Transplanted' : outcome === 'Failed' ? 'Waiting' : 'Matched';
    await prisma.recipient.update({ where: { id: m.recipientId }, data: { status: rStatus, priorFailedMatches: outcome === 'Failed' ? rc.priorFailedMatches + 1 : rc.priorFailedMatches } });
    await prisma.transplant.create({
      data: { matchId: m.id, donorId: m.donorId, recipientId: m.recipientId, outcome, transplantDate: new Date(Date.now() - rand(1,90)*86400000), notes: `Seeded transplant — outcome: ${outcome}` },
    });
    txCount++;
  }
  console.log(`   ✅ ${txCount} transplants created`);

  // ── Sample Alerts ─────────────────────────────────────────────────────────
  console.log('🔔 Creating sample alerts...');
  const waitingRecipients = await prisma.recipient.findMany({ where: { status: 'Waiting' }, take: 5 });
  for (const r of waitingRecipients) {
    await prisma.alert.create({ data: { type: 'NewMatch', message: `New compatible match found for ${r.name} (${r.organTypeNeeded}).`, recipientId: r.id } });
  }

  console.log('\n📊 Seed Summary:');
  console.table({
    hospitals: await prisma.hospital.count(),
    users:     await prisma.user.count(),
    donors:    await prisma.donor.count(),
    recipients: await prisma.recipient.count(),
    hlaAntigens: await prisma.hlaAntigen.count(),
    matches:   await prisma.compatibilityMatch.count(),
    transplants: await prisma.transplant.count(),
    alerts:    await prisma.alert.count(),
  });
  console.log('\n✅ VitalNode v2 seeded!\n');
  console.log('Default logins:');
  console.log('  admin / admin123');
  console.log('  coordinator / coord123');
  console.log('  surgeon / surgeon123');
  console.log('  auditor / auditor123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
