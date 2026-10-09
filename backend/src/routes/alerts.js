const express = require('express');
const router = express.Router();
const prisma = require('../db/prismaClient');

// GET /api/alerts — all unread alerts with context
router.get('/', async (req, res) => {
  try {
    const { unreadOnly = 'false', limit = 50 } = req.query;
    const where = unreadOnly === 'true' ? { isRead: false } : {};
    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        recipient: { select: { id: true, name: true, organTypeNeeded: true } },
        donor:     { select: { id: true, name: true, organType: true } },
      },
    });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/unread-count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await prisma.alert.count({ where: { isRead: false } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data:  { isRead: true },
    });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/mark-all-read
router.patch('/mark-all-read', async (req, res) => {
  try {
    await prisma.alert.updateMany({ where: { isRead: false }, data: { isRead: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
