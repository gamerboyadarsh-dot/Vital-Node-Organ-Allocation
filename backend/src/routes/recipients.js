/**
 * routes/recipients.js
 */
const express = require('express');
const router = express.Router();
const prisma = require('../db/prismaClient');
const { logRecipientRegistered } = require('../services/auditLogger');
const { sortByUrgency, computeUrgencyScore } = require('../services/urgencyScoring');

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const VALID_ORGAN_TYPES = ['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Cornea'];

// POST /api/recipients — register a new recipient
router.post('/', async (req, res) => {
  try {
    const { name, age, bloodGroup, organTypeNeeded, hlaType, hospitalId, severityScore, waitTimeDays, priorFailedMatches } = req.body;

    if (!name || !age || !bloodGroup || !organTypeNeeded || !hospitalId || severityScore == null) {
      return res.status(400).json({ error: 'name, age, bloodGroup, organTypeNeeded, hospitalId, severityScore are required' });
    }
    if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
      return res.status(400).json({ error: `Invalid bloodGroup` });
    }
    if (!VALID_ORGAN_TYPES.includes(organTypeNeeded)) {
      return res.status(400).json({ error: `Invalid organTypeNeeded` });
    }
    const sv = parseInt(severityScore);
    if (isNaN(sv) || sv < 1 || sv > 10) {
      return res.status(400).json({ error: 'severityScore must be 1-10' });
    }

    let hlaStr = '[]';
    if (hlaType) {
      if (Array.isArray(hlaType)) hlaStr = JSON.stringify(hlaType);
      else if (typeof hlaType === 'string') {
        try { JSON.parse(hlaType); hlaStr = hlaType; } catch { hlaStr = JSON.stringify(hlaType.split(',').map(s => s.trim())); }
      }
    }

    const recipient = await prisma.recipient.create({
      data: {
        name,
        age: parseInt(age),
        bloodGroup,
        organTypeNeeded,
        hlaType: hlaStr,
        hospitalId,
        severityScore: sv,
        waitTimeDays: parseInt(waitTimeDays) || 0,
        priorFailedMatches: parseInt(priorFailedMatches) || 0,
        status: 'Waiting',
      },
      include: { hospital: true },
    });

    await logRecipientRegistered(recipient);
    res.status(201).json(recipient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recipients — list with optional filters
router.get('/', async (req, res) => {
  try {
    const { bloodGroup, organTypeNeeded, status, hospitalId, search } = req.query;

    const where = {};
    if (bloodGroup) where.bloodGroup = bloodGroup;
    if (organTypeNeeded) where.organTypeNeeded = organTypeNeeded;
    if (status) where.status = status;
    if (hospitalId) where.hospitalId = hospitalId;
    if (search) where.name = { contains: search };

    const recipients = await prisma.recipient.findMany({
      where,
      include: { hospital: true },
      orderBy: { registeredAt: 'desc' },
    });

    // Enrich with computed urgency score
    const enriched = recipients.map(r => ({
      ...r,
      ...computeUrgencyScore(r),
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recipients/priority-list — sorted by urgency score descending
router.get('/priority-list', async (req, res) => {
  try {
    const recipients = await prisma.recipient.findMany({
      where: { status: 'Waiting' },
      include: { hospital: true },
    });

    const sorted = sortByUrgency(recipients);
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recipients/:id
router.get('/:id', async (req, res) => {
  try {
    const recipient = await prisma.recipient.findUnique({
      where: { id: req.params.id },
      include: {
        hospital: true,
        compatibilityMatches: {
          include: { donor: { include: { hospital: true } } },
          orderBy: { overallCompatibilityScore: 'desc' },
        },
      },
    });
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });
    const { urgencyScore, breakdown } = computeUrgencyScore(recipient);
    res.json({ ...recipient, urgencyScore, breakdown });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
