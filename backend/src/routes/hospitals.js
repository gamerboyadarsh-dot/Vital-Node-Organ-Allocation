/**
 * routes/hospitals.js
 */
const express = require('express');
const router = express.Router();
const prisma = require('../db/prismaClient');

// GET /api/hospitals
router.get('/', async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { donors: true, recipients: true } },
      },
    });
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hospitals/:id/overview — clinical command overview for a specific hospital
router.get('/:id/overview', async (req, res) => {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: req.params.id },
      include: {
        donors: {
          orderBy: { registeredAt: 'desc' },
          include: { transplants: true },
        },
        recipients: {
          orderBy: { severityScore: 'desc' },
          include: { transplants: true },
        },
      },
    });

    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

    const totalDonors = hospital.donors.length;
    const availableDonors = hospital.donors.filter(d => d.isAvailable).length;
    const totalRecipients = hospital.recipients.length;
    const waitingRecipients = hospital.recipients.filter(r => r.status === 'Waiting').length;

    const transplantCount = await prisma.transplant.count({
      where: {
        OR: [
          { donor: { hospitalId: req.params.id } },
          { recipient: { hospitalId: req.params.id } },
        ],
      },
    });

    res.json({
      hospital,
      stats: {
        totalDonors,
        availableDonors,
        totalRecipients,
        waitingRecipients,
        transplantCount,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/hospitals
router.post('/', async (req, res) => {
  try {
    const { name, city, latitude, longitude, contactInfo } = req.body;
    if (!name || !city || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'name, city, latitude, longitude are required' });
    }
    const hospital = await prisma.hospital.create({
      data: { name, city, latitude: parseFloat(latitude), longitude: parseFloat(longitude), contactInfo: contactInfo || '' },
    });
    res.status(201).json(hospital);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
