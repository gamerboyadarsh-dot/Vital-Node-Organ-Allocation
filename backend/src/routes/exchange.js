const express = require('express');
const router  = express.Router();
const prisma  = require('../db/prismaClient');
const { isBloodCompatible } = require('../services/bloodCompatibility');
const { haversineDistance } = require('../services/geoSearch');
const { estimateCitHours, isCitExceeded } = require('../config/citLimits');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

/**
 * Helper to test compatibility and CIT feasibility between donor and recipient
 */
function testPairCompatibility(donor, recipient) {
  if (!donor || !recipient) return { compatible: false };
  const bloodOk = isBloodCompatible(donor.bloodGroup, recipient.bloodGroup);
  const organOk = donor.organType === recipient.organTypeNeeded;
  if (!bloodOk || !organOk) return { compatible: false };

  const distKm = haversineDistance(
    donor.hospital.latitude,
    donor.hospital.longitude,
    recipient.hospital.latitude,
    recipient.hospital.longitude
  );

  const citHours = estimateCitHours(distKm);
  const citExceeded = isCitExceeded(distKm, donor.organType);

  return {
    compatible: !citExceeded,
    distKm: Math.round(distKm),
    citHours: Number(citHours.toFixed(1)),
    citExceeded,
  };
}

// GET /api/exchange/candidate-graph — returns donors, recipients, and candidate edges for 3D visualization
router.get('/candidate-graph', async (req, res) => {
  try {
    const donors = await prisma.donor.findMany({
      where: { isAvailable: true, consentStatus: 'Consented' },
      take: 40,
      include: { hospital: { select: { name: true, city: true, latitude: true, longitude: true } } },
    });

    const recipients = await prisma.recipient.findMany({
      where: { status: 'Waiting' },
      take: 50,
      include: { hospital: { select: { name: true, city: true, latitude: true, longitude: true } } },
    });

    const matches = await prisma.compatibilityMatch.findMany({
      where: {
        matchStatus: { in: ['Candidate', 'Shortlisted', 'Finalized'] },
        citExceeded: false,
      },
      take: 100,
      select: {
        id: true,
        donorId: true,
        recipientId: true,
        hlaMatchScore: true,
        overallCompatibilityScore: true,
        matchStatus: true,
      },
    });

    res.json({ donors, recipients, edges: matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exchange/propose — 2-Way, 3-Way, and Altruistic Chain detection
router.post('/propose', async (req, res) => {
  try {
    const { pairs = [], altruisticDonorId = null } = req.body;

    if (!Array.isArray(pairs) && !altruisticDonorId) {
      return res.status(400).json({ error: 'Provide at least pairs or an altruistic donor' });
    }

    // Enrich pairs with donor and recipient models
    const enrichedPairs = await Promise.all(
      pairs.map(async (p) => {
        const donor = await prisma.donor.findUnique({ where: { id: p.donorId }, include: { hospital: true } });
        const recipient = await prisma.recipient.findUnique({ where: { id: p.intendedRecipientId }, include: { hospital: true } });
        return { donorId: p.donorId, intendedRecipientId: p.intendedRecipientId, donor, recipient };
      })
    );

    const proposedCycles = [];

    // 1. Check for Altruistic Donor Chains if altruisticDonorId provided
    if (altruisticDonorId && enrichedPairs.length >= 1) {
      const altDonor = await prisma.donor.findUnique({ where: { id: altruisticDonorId }, include: { hospital: true } });
      if (altDonor) {
        for (let i = 0; i < enrichedPairs.length; i++) {
          const p1 = enrichedPairs[i];
          const test1 = testPairCompatibility(altDonor, p1.recipient);
          if (test1.compatible) {
            // Check if p1's donor can give to another recipient p2 or waitlist
            for (let j = 0; j < enrichedPairs.length; j++) {
              if (i === j) continue;
              const p2 = enrichedPairs[j];
              const test2 = testPairCompatibility(p1.donor, p2.recipient);
              if (test2.compatible) {
                const chainCycle = await prisma.$transaction(async (tx) => {
                  const c = await tx.exchangeCycle.create({
                    data: { cycleType: 'Chain', status: 'Proposed', altruisticDonorId },
                  });
                  await tx.exchangeLeg.createMany({
                    data: [
                      { cycleId: c.id, donorId: altDonor.id, recipientId: p1.intendedRecipientId, legOrder: 1 },
                      { cycleId: c.id, donorId: p1.donorId, recipientId: p2.intendedRecipientId, legOrder: 2 },
                    ],
                  });
                  return tx.exchangeCycle.findUnique({ where: { id: c.id }, include: { legs: true } });
                });
                proposedCycles.push(chainCycle);
              }
            }
          }
        }
      }
    }

    // 2. Check 2-Way Cycles (A -> B, B -> A)
    for (let i = 0; i < enrichedPairs.length; i++) {
      for (let j = i + 1; j < enrichedPairs.length; j++) {
        const pA = enrichedPairs[i];
        const pB = enrichedPairs[j];

        const aToB = testPairCompatibility(pA.donor, pB.recipient);
        const bToA = testPairCompatibility(pB.donor, pA.recipient);

        if (aToB.compatible && bToA.compatible) {
          const cycle = await prisma.$transaction(async (tx) => {
            const c = await tx.exchangeCycle.create({
              data: { cycleType: '2Way', status: 'Proposed' },
            });
            await tx.exchangeLeg.createMany({
              data: [
                { cycleId: c.id, donorId: pA.donorId, recipientId: pB.intendedRecipientId, legOrder: 1 },
                { cycleId: c.id, donorId: pB.donorId, recipientId: pA.intendedRecipientId, legOrder: 2 },
              ],
            });
            await tx.auditLog.create({
              data: {
                entityType: 'Exchange',
                entityId: c.id,
                action: AUDIT_ACTIONS.EXCHANGE_PROPOSED,
                actor: 'System (Cycle Engine)',
                details: `2-Way swap: ${pA.donor.name} → ${pB.recipient.name} (${aToB.citHours}h CIT) | ${pB.donor.name} → ${pA.recipient.name} (${bToA.citHours}h CIT)`,
              },
            });
            return tx.exchangeCycle.findUnique({ where: { id: c.id }, include: { legs: true } });
          });
          proposedCycles.push(cycle);
        }
      }
    }

    // 3. Check 3-Way Cycles (A -> B, B -> C, C -> A)
    if (enrichedPairs.length >= 3) {
      for (let i = 0; i < enrichedPairs.length; i++) {
        for (let j = 0; j < enrichedPairs.length; j++) {
          if (j === i) continue;
          for (let k = 0; k < enrichedPairs.length; k++) {
            if (k === i || k === j) continue;
            const pA = enrichedPairs[i];
            const pB = enrichedPairs[j];
            const pC = enrichedPairs[k];

            const aToB = testPairCompatibility(pA.donor, pB.recipient);
            const bToC = testPairCompatibility(pB.donor, pC.recipient);
            const cToA = testPairCompatibility(pC.donor, pA.recipient);

            if (aToB.compatible && bToC.compatible && cToA.compatible) {
              const cycle = await prisma.$transaction(async (tx) => {
                const c = await tx.exchangeCycle.create({
                  data: { cycleType: '3Way', status: 'Proposed' },
                });
                await tx.exchangeLeg.createMany({
                  data: [
                    { cycleId: c.id, donorId: pA.donorId, recipientId: pB.intendedRecipientId, legOrder: 1 },
                    { cycleId: c.id, donorId: pB.donorId, recipientId: pC.intendedRecipientId, legOrder: 2 },
                    { cycleId: c.id, donorId: pC.donorId, recipientId: pA.intendedRecipientId, legOrder: 3 },
                  ],
                });
                await tx.auditLog.create({
                  data: {
                    entityType: 'Exchange',
                    entityId: c.id,
                    action: AUDIT_ACTIONS.EXCHANGE_PROPOSED,
                    actor: 'System (3-Way Engine)',
                    details: `3-Way triangular cycle: ${pA.donor.name} → ${pB.recipient.name} → ${pC.recipient.name} → ${pA.recipient.name}`,
                  },
                });
                return tx.exchangeCycle.findUnique({ where: { id: c.id }, include: { legs: true } });
              });
              proposedCycles.push(cycle);
            }
          }
        }
      }
    }

    if (proposedCycles.length === 0) {
      return res.status(200).json({ message: 'No valid closed cycles found for given pairs', cycles: [] });
    }
    res.json({ cycles: proposedCycles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exchange/:id/activate — atomic lock across all participants
router.post('/:id/activate', async (req, res) => {
  try {
    const cycle = await prisma.exchangeCycle.findUnique({
      where: { id: req.params.id },
      include: { legs: true },
    });
    if (!cycle) return res.status(404).json({ error: 'Cycle not found' });
    if (cycle.status !== 'Proposed') return res.status(409).json({ error: 'Cycle not in Proposed state' });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify availability of every node in cycle
      for (const leg of cycle.legs) {
        const donor = await tx.donor.findUnique({ where: { id: leg.donorId } });
        if (!donor || !donor.isAvailable) throw new Error(`Donor ${leg.donorId} is no longer available`);
        const recipient = await tx.recipient.findUnique({ where: { id: leg.recipientId } });
        if (!recipient || recipient.status !== 'Waiting') throw new Error(`Recipient ${leg.recipientId} is no longer waiting`);
      }

      // 2. Lock every donor and recipient simultaneously
      for (const leg of cycle.legs) {
        await tx.donor.update({ where: { id: leg.donorId }, data: { isAvailable: false } });
        await tx.recipient.update({ where: { id: leg.recipientId }, data: { status: 'Matched' } });
        await tx.exchangeLeg.update({ where: { id: leg.id }, data: { status: 'Completed' } });
      }

      const updated = await tx.exchangeCycle.update({
        where: { id: cycle.id },
        data: { status: 'Active' },
        include: { legs: true },
      });

      await tx.auditLog.create({
        data: {
          entityType: 'Exchange',
          entityId: cycle.id,
          action: AUDIT_ACTIONS.EXCHANGE_ACTIVATED,
          actor: 'Coordinator',
          details: `Activated ${cycle.cycleType} cycle with ${cycle.legs.length} mutually-dependent legs.`,
        },
      });

      return updated;
    });

    if (req.io) req.io.emit('exchange:activated', result);
    res.json(result);
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// GET /api/exchange — all cycles
router.get('/', async (req, res) => {
  try {
    const cycles = await prisma.exchangeCycle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        legs: {
          include: {
            donor:     { select: { id: true, name: true, organType: true, bloodGroup: true, hospital: true } },
            recipient: { select: { id: true, name: true, organTypeNeeded: true, bloodGroup: true, hospital: true } },
          },
        },
      },
    });
    res.json(cycles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
