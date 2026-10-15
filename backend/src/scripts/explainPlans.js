const prisma = require('../db/prismaClient');

async function testPlans() {
  const queries = [
    {
      name: '4-Table Relational JOIN',
      sql: `EXPLAIN QUERY PLAN
            SELECT m.id, d.name AS donor, r.name AS recipient, h.name AS hospital
            FROM compatibility_matches m
            JOIN donors d ON m.donor_id = d.id
            JOIN recipients r ON m.recipient_id = r.id
            JOIN hospitals h ON d.hospital_id = h.id
            LIMIT 5;`
    },
    {
      name: 'Composite Index Search (idx_donor_organ_blood)',
      sql: `EXPLAIN QUERY PLAN
            SELECT * FROM donors
            WHERE organ_type = 'Kidney' AND blood_group = 'O+';`
    },
    {
      name: 'Single Index Search (idx_recipient_status)',
      sql: `EXPLAIN QUERY PLAN
            SELECT * FROM recipients
            WHERE status = 'Waiting';`
    },
    {
      name: 'Correlated Subquery',
      sql: `EXPLAIN QUERY PLAN
            SELECT r.name, r.organ_type_needed, r.severity_score
            FROM recipients r
            WHERE r.status = 'Waiting'
              AND r.severity_score > (
                SELECT AVG(r2.severity_score)
                FROM recipients r2
                WHERE r2.organ_type_needed = r.organ_type_needed
              );`
    }
  ];

  for (const q of queries) {
    console.log(`\n=== ${q.name} ===`);
    const plan = await prisma.$queryRawUnsafe(q.sql);
    console.log(plan);
  }

  await prisma.$disconnect();
}

testPlans();
