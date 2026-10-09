/**
 * routes/transplants.js
 */
const express = require('express');
const router = express.Router();
const prisma = require('../db/prismaClient');
const { updateTransplantOutcome } = require('../services/allocation');

// GET /api/transplants
router.get('/', async (req, res) => {
  try {
    const transplants = await prisma.transplant.findMany({
      include: {
        match: true,
        donor: { include: { hospital: true } },
        recipient: { include: { hospital: true } },
      },
      orderBy: { transplantDate: 'desc' },
    });
    res.json(transplants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transplants/:id
router.get('/:id', async (req, res) => {
  try {
    const transplant = await prisma.transplant.findUnique({
      where: { id: req.params.id },
      include: {
        match: true,
        donor: { include: { hospital: true } },
        recipient: { include: { hospital: true } },
      },
    });
    if (!transplant) return res.status(404).json({ error: 'Transplant not found' });
    res.json(transplant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transplants/:id/outcome — mark Success / Failed
router.post('/:id/outcome', async (req, res) => {
  try {
    const { outcome, notes } = req.body;
    if (!['Success', 'Failed'].includes(outcome)) {
      return res.status(400).json({ error: 'outcome must be "Success" or "Failed"' });
    }
    const transplant = await updateTransplantOutcome(req.params.id, outcome, notes);
    res.json({ message: `Transplant marked as ${outcome}`, transplant });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
