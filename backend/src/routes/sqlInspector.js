/**
 * routes/sqlInspector.js
 * Interactive SQL & Relational Database Evaluation Inspector
 * Supports: Raw SQL queries, Joins, Nested Queries, Aggregates, Views, and Triggers.
 */
const express = require('express');
const router = express.Router();
const prisma = require('../db/prismaClient');

// Initialize database view and trigger on startup
async function initDatabaseObjects() {
  try {
    // 1. Create SQL View
    await prisma.$executeRawUnsafe(`
      CREATE VIEW IF NOT EXISTS v_critical_waitlist AS
      SELECT r.id, r.name, r.blood_group, r.organ_type_needed, r.severity_score, r.wait_time_days,
             h.name AS hospital_name, h.city
      FROM recipients r
      JOIN hospitals h ON r.hospital_id = h.id
      WHERE r.status = 'Waiting' AND r.severity_score >= 8;
    `);

    // 2. Create Audit Trigger (Audit Log on Recipient status change)
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER IF NOT EXISTS trg_recipient_status_audit
      AFTER UPDATE OF status ON recipients
      FOR EACH ROW
      WHEN OLD.status != NEW.status
      BEGIN
        INSERT INTO audit_logs (id, entity_type, entity_id, action, actor, details, timestamp)
        VALUES (
          lower(hex(randomblob(16))),
          'Recipient',
          NEW.id,
          'STATUS_TRIGGER_FIRED',
          'DB_TRIGGER',
          'Status changed from ' || OLD.status || ' to ' || NEW.status,
          datetime('now')
        );
      END;
    `);
  } catch (err) {
    console.warn('⚠️ SQL View/Trigger init warning:', err.message);
  }
}

initDatabaseObjects();

// Catalog of academic evaluation queries ready for live demonstration
const PRESET_QUERIES = [
  {
    id: 'joins',
    name: '1. Multi-Table Relational JOIN (4 Tables)',
    description: 'Inner joins CompatibilityMatches with Donors, Recipients, and Hospital Hubs with multi-criteria ranking.',
    sql: `SELECT m.id AS match_id,
       d.name AS donor_name, d.blood_group AS donor_blood, d.organ_type,
       h1.name AS donor_hospital, h1.city AS donor_city,
       r.name AS recipient_name, r.blood_group AS recipient_blood, r.severity_score,
       h2.name AS recipient_hospital,
       ROUND(m.overall_compatibility_score, 1) AS compatibility_score,
       ROUND(m.distance_km, 1) AS distance_km,
       m.match_status
FROM compatibility_matches m
JOIN donors d ON m.donor_id = d.id
JOIN recipients r ON m.recipient_id = r.id
JOIN hospitals h1 ON d.hospital_id = h1.id
JOIN hospitals h2 ON r.hospital_id = h2.id
ORDER BY m.overall_compatibility_score DESC
LIMIT 12;`
  },
  {
    id: 'nested',
    name: '2. Nested Subquery with Correlated Filter',
    description: 'Finds waiting candidates whose clinical severity strictly exceeds the organ-specific average across all hospitals.',
    sql: `SELECT r.name,
       r.organ_type_needed,
       r.severity_score,
       r.wait_time_days,
       h.name AS hospital_name,
       h.city,
       ROUND((SELECT AVG(r2.severity_score) 
              FROM recipients r2 
              WHERE r2.organ_type_needed = r.organ_type_needed), 2) AS organ_avg_severity
FROM recipients r
JOIN hospitals h ON r.hospital_id = h.id
WHERE r.status = 'Waiting'
  AND r.severity_score > (
    SELECT AVG(r2.severity_score)
    FROM recipients r2
    WHERE r2.organ_type_needed = r.organ_type_needed
  )
ORDER BY r.severity_score DESC
LIMIT 15;`
  },
  {
    id: 'aggregate',
    name: '3. Aggregate Functions with GROUP BY & HAVING',
    description: 'Computes COUNT, AVG age, available inventory, MIN, and MAX age grouped by organ category filtered by HAVING clause.',
    sql: `SELECT d.organ_type,
       COUNT(d.id) AS total_donors,
       COUNT(CASE WHEN d.is_available = 1 THEN 1 END) AS active_available,
       ROUND(AVG(d.age), 1) AS average_age,
       MIN(d.age) AS youngest_donor_age,
       MAX(d.age) AS oldest_donor_age
FROM donors d
GROUP BY d.organ_type
HAVING COUNT(d.id) > 0
ORDER BY total_donors DESC;`
  },
  {
    id: 'view',
    name: '4. Database View Query (v_critical_waitlist)',
    description: 'Demonstrates reading from an active material/virtual database view created directly inside the database schema.',
    sql: `SELECT * FROM v_critical_waitlist ORDER BY severity_score DESC, wait_time_days DESC LIMIT 15;`
  },
  {
    id: 'nosql_json',
    name: '5. Semi-Structured NoSQL / JSON Array Inspection',
    description: 'Demonstrates JSON array extraction and searching on multi-locus HLA tissue typing sequences.',
    sql: `SELECT d.name, d.organ_type, d.blood_group, d.hla_type
FROM donors d
WHERE json_valid(d.hla_type) = 1
ORDER BY d.created_at DESC
LIMIT 10;`
  },
  {
    id: 'triggers',
    name: '6. Trigger Activity & Audit Log Inspection',
    description: 'Retrieves audit records including those generated automatically by the database trigger.',
    sql: `SELECT id, entity_type, action, actor, details, timestamp
FROM audit_logs
ORDER BY timestamp DESC
LIMIT 15;`
  }
];

// GET /api/sql/presets — get available demo queries
router.get('/presets', (req, res) => {
  res.json(PRESET_QUERIES);
});

// POST /api/sql/execute — execute safe SQL query
router.post('/execute', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'SQL query string required' });
    }

    const trimmed = query.trim();
    // Safety check: block destructive schema drop commands during evaluation
    const normalized = trimmed.toUpperCase();
    if (normalized.includes('DROP DATABASE') || normalized.includes('DROP TABLE')) {
      return res.status(403).json({ error: 'DROP TABLE/DATABASE is restricted for safety during live demonstration.' });
    }

    const startTime = Date.now();
    const rows = await prisma.$queryRawUnsafe(trimmed);
    const executionTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      query: trimmed,
      rowCount: Array.isArray(rows) ? rows.length : (rows?.length || 0),
      executionTimeMs,
      columns: Array.isArray(rows) && rows.length > 0 ? Object.keys(rows[0]) : [],
      data: rows
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
