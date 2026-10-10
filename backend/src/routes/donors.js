/**
 * routes/donors.js
 */
const express = require('express');
const router = express.Router();
const prisma = require('../db/prismaClient');
const { logDonorRegistered, logConsentChange } = require('../services/auditLogger');
const { getRankedMatches } = require('../services/compatibilityEngine');

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const VALID_ORGAN_TYPES = ['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Cornea'];
const VALID_CONSENT = ['Pending', 'Consented', 'Revoked'];

// POST /api/donors — register a new donor
router.post('/', async (req, res) => {
  try {
    const { name, age, bloodGroup, organType, hlaType, hospitalId, consentStatus } = req.body;

    if (!name || !age || !bloodGroup || !organType || !hospitalId) {
      return res.status(400).json({ error: 'name, age, bloodGroup, organType, hospitalId are required' });
    }
    if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
      return res.status(400).json({ error: `Invalid bloodGroup. Must be one of: ${VALID_BLOOD_GROUPS.join(', ')}` });
    }
    if (!VALID_ORGAN_TYPES.includes(organType)) {
      return res.status(400).json({ error: `Invalid organType. Must be one of: ${VALID_ORGAN_TYPES.join(', ')}` });
    }

    // Normalize HLA type to JSON string
    let hlaStr = '[]';
    if (hlaType) {
      if (Array.isArray(hlaType)) hlaStr = JSON.stringify(hlaType);
      else if (typeof hlaType === 'string') {
        // Accept either JSON array string or comma-separated
        try { JSON.parse(hlaType); hlaStr = hlaType; } catch { hlaStr = JSON.stringify(hlaType.split(',').map(s => s.trim())); }
      }
    }

    const donor = await prisma.donor.create({
      data: {
        name,
        age: parseInt(age),
        bloodGroup,
        organType,
        hlaType: hlaStr,
        hospitalId,
        consentStatus: consentStatus || 'Pending',
        isAvailable: true,
      },
      include: { hospital: true },
    });

    await logDonorRegistered(donor);
    res.status(201).json(donor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/donors — list with optional filters
router.get('/', async (req, res) => {
  try {
    const { bloodGroup, organType, isAvailable, hospitalId, consentStatus, search } = req.query;

    const where = {};
    if (bloodGroup) where.bloodGroup = bloodGroup;
    if (organType) where.organType = organType;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (hospitalId) where.hospitalId = hospitalId;
    if (consentStatus) where.consentStatus = consentStatus;
    if (search) where.name = { contains: search };

    const donors = await prisma.donor.findMany({
      where,
      include: { hospital: true },
      orderBy: { registeredAt: 'desc' },
    });

    res.json(donors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/donors/:id
router.get('/:id', async (req, res) => {
  try {
    const donor = await prisma.donor.findUnique({
      where: { id: req.params.id },
      include: {
        hospital: true,
        compatibilityMatches: {
          include: { recipient: { include: { hospital: true } } },
          orderBy: { overallCompatibilityScore: 'desc' },
        },
      },
    });
    if (!donor) return res.status(404).json({ error: 'Donor not found' });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/donors/:id/consent — update consent status
router.patch('/:id/consent', async (req, res) => {
  try {
    const { consentStatus, actor } = req.body;
    if (!VALID_CONSENT.includes(consentStatus)) {
      return res.status(400).json({ error: `Invalid consentStatus. Must be one of: ${VALID_CONSENT.join(', ')}` });
    }

    const donor = await prisma.donor.update({
      where: { id: req.params.id },
      data: { consentStatus },
      include: { hospital: true },
    });

    await logConsentChange(donor, consentStatus, actor);
    res.json(donor);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Donor not found' });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/donors/:id/matches — run compatibility engine and return ranked matches + exclusion diagnostics
router.get('/:id/matches', async (req, res) => {
  try {
    const result = await getRankedMatches(req.params.id);
    // Return both matches and zero-match diagnostic breakdown
    res.json(result);
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ error: err.message });
    if (err.message.includes('not available')) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
// PUT /api/donors/:id — update donor record
router.put('/:id', async (req, res) => {
  try {
    const { name, age, bloodGroup, organType, hospitalId, isAvailable, consentStatus } = req.body;

    const data = {};
    if (name) data.name = name;
    if (age !== undefined) data.age = parseInt(age);
    if (bloodGroup) {
      if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
        return res.status(400).json({ error: `Invalid bloodGroup` });
      }
      data.bloodGroup = bloodGroup;
    }
    if (organType) {
      if (!VALID_ORGAN_TYPES.includes(organType)) {
        return res.status(400).json({ error: `Invalid organType` });
      }
      data.organType = organType;
    }
    if (hospitalId) data.hospitalId = hospitalId;
    if (isAvailable !== undefined) data.isAvailable = Boolean(isAvailable);
    if (consentStatus) {
      if (!VALID_CONSENT.includes(consentStatus)) {
        return res.status(400).json({ error: `Invalid consentStatus` });
      }
      data.consentStatus = consentStatus;
    }

    const donor = await prisma.donor.update({
      where: { id: req.params.id },
      data,
      include: { hospital: true },
    });

    const { writeAuditLog } = require('../services/auditLogger');
    await writeAuditLog({
      entityType: 'Donor',
      entityId: donor.id,
      action: 'UPDATED',
      actor: req.body.actor || 'ClinicalCoordinator',
      details: `Donor ${donor.name} record updated: ${JSON.stringify(data)}`,
    });

    res.json(donor);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Donor not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/donors/:id — delete donor record (if not finalized/transplanted)
router.delete('/:id', async (req, res) => {
  try {
    const donor = await prisma.donor.findUnique({
      where: { id: req.params.id },
      include: { transplants: true, compatibilityMatches: { where: { matchStatus: 'Finalized' } } },
    });

    if (!donor) return res.status(404).json({ error: 'Donor not found' });
    if (donor.transplants.length > 0 || donor.compatibilityMatches.length > 0) {
      return res.status(400).json({ error: 'Cannot delete donor with finalized allocation or completed transplant.' });
    }

    // Clean up candidate matches first
    await prisma.compatibilityMatch.deleteMany({
      where: { donorId: req.params.id },
    });

    await prisma.donor.delete({
      where: { id: req.params.id },
    });

    const { writeAuditLog } = require('../services/auditLogger');
    await writeAuditLog({
      entityType: 'Donor',
      entityId: req.params.id,
      action: 'DELETED',
      actor: req.body?.actor || 'ClinicalCoordinator',
      details: `Donor ${donor.name} [${donor.organType}] record deleted from system.`,
    });

    res.json({ success: true, message: `Donor ${donor.name} deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
