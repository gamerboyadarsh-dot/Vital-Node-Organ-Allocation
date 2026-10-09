/**
 * routes/audit.js
 * Module: Consent & Audit Trail
 *
 * READ-ONLY route — AuditLog is append-only; no POST/PUT/DELETE exposed here.
 */
const express = require('express');
const router = express.Router();
const prisma = require('../db/prismaClient');

// GET /api/audit-log/export — CSV / JSON export of regulatory audit ledger
router.get('/export', async (req, res) => {
  try {
    const { format = 'csv', action, actor, startDate, endDate } = req.query;

    const where = {};
    if (action) where.action = action;
    if (actor) where.actor = { contains: actor };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="vitalnode-audit-ledger.json"');
      return res.send(JSON.stringify(logs, null, 2));
    }

    // CSV format
    const headers = ['ID', 'Timestamp', 'Entity Type', 'Entity ID', 'Action', 'Actor', 'Details'];
    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    const csvRows = [
      headers.join(','),
      ...logs.map(l => [
        escapeCsv(l.id),
        escapeCsv(l.timestamp.toISOString()),
        escapeCsv(l.entityType),
        escapeCsv(l.entityId),
        escapeCsv(l.action),
        escapeCsv(l.actor),
        escapeCsv(l.details),
      ].join(',')),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="vitalnode-audit-ledger.csv"');
    res.send(csvRows.join('\r\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/audit-log — paginated, filterable
router.get('/', async (req, res) => {
  try {
    const { entityType, entityId, action, actor, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (actor) where.actor = { contains: actor };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
