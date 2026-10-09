/**
 * routes/analytics.js
 * Module: Analytics Dashboard
 */
const express = require('express');
const router = express.Router();
const prisma = require('../db/prismaClient');

// GET /api/analytics/summary — totals and rates
router.get('/summary', async (req, res) => {
  try {
    const [
      totalDonors,
      availableDonors,
      totalRecipients,
      waitingRecipients,
      totalMatches,
      finalizedMatches,
      totalTransplants,
      successTransplants,
      failedTransplants,
    ] = await Promise.all([
      prisma.donor.count(),
      prisma.donor.count({ where: { isAvailable: true } }),
      prisma.recipient.count(),
      prisma.recipient.count({ where: { status: 'Waiting' } }),
      prisma.compatibilityMatch.count(),
      prisma.compatibilityMatch.count({ where: { matchStatus: 'Finalized' } }),
      prisma.transplant.count(),
      prisma.transplant.count({ where: { outcome: 'Success' } }),
      prisma.transplant.count({ where: { outcome: 'Failed' } }),
    ]);

    // Average wait time for all waiting recipients
    const waitingRecipientsData = await prisma.recipient.findMany({
      where: { status: 'Waiting' },
      select: { waitTimeDays: true },
    });
    const avgWaitTime = waitingRecipientsData.length > 0
      ? Math.round(waitingRecipientsData.reduce((sum, r) => sum + r.waitTimeDays, 0) / waitingRecipientsData.length)
      : 0;

    const successRate = totalTransplants > 0 ? Math.round((successTransplants / totalTransplants) * 100) : 0;

    res.json({
      totalDonors,
      availableDonors,
      totalRecipients,
      waitingRecipients,
      totalMatches,
      finalizedMatches,
      totalTransplants,
      successTransplants,
      failedTransplants,
      successRate,
      avgWaitTime,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/by-hospital — per-hospital breakdown
router.get('/by-hospital', async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      include: {
        _count: {
          select: { donors: true, recipients: true },
        },
      },
    });

    const result = await Promise.all(
      hospitals.map(async (h) => {
        const [donors, recipients, transplants] = await Promise.all([
          prisma.donor.count({ where: { hospitalId: h.id } }),
          prisma.recipient.count({ where: { hospitalId: h.id } }),
          prisma.transplant.count({ where: { donor: { hospitalId: h.id } } }),
        ]);
        return {
          hospitalId: h.id,
          hospitalName: h.name,
          city: h.city,
          donors,
          recipients,
          transplants,
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/organ-distribution — organ type stats
router.get('/organ-distribution', async (req, res) => {
  try {
    const organTypes = ['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Cornea'];
    const result = await Promise.all(
      organTypes.map(async (organ) => ({
        organ,
        donors: await prisma.donor.count({ where: { organType: organ } }),
        recipients: await prisma.recipient.count({ where: { organTypeNeeded: organ } }),
        transplants: await prisma.transplant.count({ where: { donor: { organType: organ } } }),
      }))
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/transplant-outcomes — outcomes breakdown
router.get('/transplant-outcomes', async (req, res) => {
  try {
    const [success, failed, pending] = await Promise.all([
      prisma.transplant.count({ where: { outcome: 'Success' } }),
      prisma.transplant.count({ where: { outcome: 'Failed' } }),
      prisma.transplant.count({ where: { outcome: 'Pending' } }),
    ]);
    res.json([
      { name: 'Success', value: success },
      { name: 'Failed', value: failed },
      { name: 'Pending', value: pending },
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/survival-distribution — histogram of predicted 5-yr survival
router.get('/survival-distribution', async (req, res) => {
  try {
    const matches = await prisma.compatibilityMatch.findMany({
      where: { predictedGraftSurvival5yr: { not: null } },
      select: { predictedGraftSurvival5yr: true },
    });

    const bands = [
      { band: '0-20%', count: 0 },
      { band: '21-40%', count: 0 },
      { band: '41-60%', count: 0 },
      { band: '61-80%', count: 0 },
      { band: '81-100%', count: 0 },
    ];

    matches.forEach(m => {
      const s = m.predictedGraftSurvival5yr;
      if (s <= 20) bands[0].count++;
      else if (s <= 40) bands[1].count++;
      else if (s <= 60) bands[2].count++;
      else if (s <= 80) bands[3].count++;
      else bands[4].count++;
    });

    res.json(bands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/cit-risk — early warning for organs approaching/exceeding limits
router.get('/cit-risk', async (req, res) => {
  try {
    const { CIT_LIMITS_HOURS } = require('../config/citLimits');
    const organTypes = ['Heart', 'Lung', 'Liver', 'Kidney', 'Pancreas', 'Cornea'];

    const riskData = await Promise.all(organTypes.map(async (organ) => {
      const limit = CIT_LIMITS_HOURS[organ];
      const matches = await prisma.compatibilityMatch.findMany({
        where: { donor: { organType: organ }, matchStatus: 'Candidate' },
        select: { coldIschemicTimeHours: true },
      });

      if (matches.length === 0) {
        return { organ, limit, avgCit: 0, warningPct: 0, totalCandidates: 0 };
      }

      const totalCit = matches.reduce((acc, m) => acc + (m.coldIschemicTimeHours || 0), 0);
      const avgCit = Number((totalCit / matches.length).toFixed(1));
      const warningCount = matches.filter(m => (m.coldIschemicTimeHours || 0) > (limit * 0.75)).length;
      const warningPct = Math.round((warningCount / matches.length) * 100);

      return { organ, limit, avgCit, warningPct, totalCandidates: matches.length };
    }));

    res.json(riskData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/exchange-impact — compare urgency in exchange cycles vs standard waitlist
router.get('/exchange-impact', async (req, res) => {
  try {
    const activeCycles = await prisma.exchangeCycle.findMany({
      where: { status: 'Active' },
      include: { legs: { include: { recipient: true } } },
    });

    const activeRecipients = activeCycles.flatMap(c => c.legs.map(l => l.recipient));
    const activeAvgSeverity = activeRecipients.length > 0 
      ? Number((activeRecipients.reduce((sum, r) => sum + r.severityScore, 0) / activeRecipients.length).toFixed(1))
      : 0;

    const waitingRecipients = await prisma.recipient.findMany({
      where: { status: 'Waiting' },
      select: { severityScore: true },
    });
    const waitAvgSeverity = waitingRecipients.length > 0
      ? Number((waitingRecipients.reduce((sum, r) => sum + (r.severityScore || 0), 0) / waitingRecipients.length).toFixed(1))
      : 0;

    res.json({
      exchangeRecipientsCount: activeRecipients.length,
      exchangeAvgSeverity: activeAvgSeverity,
      waitlistRecipientsCount: waitingRecipients.length,
      waitlistAvgSeverity: waitAvgSeverity,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
