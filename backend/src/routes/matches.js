/**
 * routes/matches.js
 */
const express = require('express');
const router = express.Router();
const prisma = require('../db/prismaClient');
const { finalizeMatch, rejectMatch } = require('../services/allocation');

// GET /api/matches — list all matches with optional filters
router.get('/', async (req, res) => {
  try {
    const { donorId, recipientId, matchStatus } = req.query;
    const where = {};
    if (donorId) where.donorId = donorId;
    if (recipientId) where.recipientId = recipientId;
    if (matchStatus) where.matchStatus = matchStatus;

    const matches = await prisma.compatibilityMatch.findMany({
      where,
      include: {
        donor: { include: { hospital: true } },
        recipient: { include: { hospital: true } },
        transplant: true,
      },
      orderBy: { overallCompatibilityScore: 'desc' },
    });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches/:matchId/finalize — ACID allocation transaction
router.post('/:matchId/finalize', async (req, res) => {
  try {
    const result = await finalizeMatch(req.params.matchId);
    if (req.io) {
      req.io.emit('match:finalized', {
        matchId: req.params.matchId,
        donorId: result.match.donorId,
        recipientId: result.match.recipientId,
        timestamp: Date.now()
      });
    }
    res.json({
      message: 'Match finalized successfully',
      transplant: result.transplant,
      match: result.match,
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

// POST /api/matches/:matchId/reject — reject a candidate match
router.post('/:matchId/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const match = await rejectMatch(req.params.matchId, reason);
    res.json({ message: 'Match rejected', match });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
