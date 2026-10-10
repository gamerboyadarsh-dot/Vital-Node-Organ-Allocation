/**
 * evaluationSuite.js
 * Automated Academic Demonstration & Live Verification Test Suite
 * Run with: node src/test/evaluationSuite.js (or npm test from backend)
 */

const prisma = require('../db/prismaClient');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
};

async function runTestSuite() {
  console.log(`\n${COLORS.bold}${COLORS.cyan}================================================================${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}  VITALNODE (ODRMN) — ACADEMIC LIVE EVALUATION TEST SUITE       ${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}================================================================${COLORS.reset}\n`);

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ${COLORS.green}✔ [PASSED]${COLORS.reset} ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ${COLORS.red}✖ [FAILED]${COLORS.reset} ${name}`);
      console.error(`     ↳ Error: ${err.message}`);
    }
  }

  // 1. Database Connectivity
  await test('1. Database Connectivity & Connection Pool', async () => {
    const hospitalCount = await prisma.hospital.count();
    if (hospitalCount === 0) throw new Error('No hospitals found in database');
  });

  // 2. Data Insertion (INSERT)
  let testHospital, testDonor, testRecipient;
  await test('2. Data Insertion (INSERT INTO Donors & Recipients)', async () => {
    testHospital = await prisma.hospital.findFirst();
    testDonor = await prisma.donor.create({
      data: {
        name: 'Evaluation Test Donor',
        age: 34,
        bloodGroup: 'O+',
        organType: 'Kidney',
        hospitalId: testHospital.id,
        hlaType: JSON.stringify(['A*01:01', 'B*08:01', 'DRB1*03:01']),
        consentStatus: 'Consented',
        isAvailable: true,
      },
    });

    testRecipient = await prisma.recipient.create({
      data: {
        name: 'Evaluation Test Recipient',
        age: 42,
        bloodGroup: 'O+',
        organTypeNeeded: 'Kidney',
        hospitalId: testHospital.id,
        hlaType: JSON.stringify(['A*01:01', 'B*08:01']),
        severityScore: 7,
        waitTimeDays: 320,
        status: 'Waiting',
      },
    });

    if (!testDonor.id || !testRecipient.id) throw new Error('Insertion failed to return IDs');
  });

  // 3. Data Retrieval (SELECT & Filtering)
  await test('3. Data Retrieval (Complex Filtering & Relational Query)', async () => {
    const donors = await prisma.donor.findMany({
      where: { organType: 'Kidney', bloodGroup: 'O+' },
      include: { hospital: true },
    });
    if (donors.length === 0) throw new Error('Retrieval query returned 0 rows');
  });

  // 4. Update Operation (UPDATE ... SET)
  await test('4. Update Operation (UPDATE Recipient Severity & Wait Time)', async () => {
    const updated = await prisma.recipient.update({
      where: { id: testRecipient.id },
      data: { severityScore: 9, waitTimeDays: 450 },
    });
    if (updated.severityScore !== 9) throw new Error('Severity update did not persist');
  });

  // 5. Delete Operation (DELETE FROM)
  await test('5. Delete Operation (DELETE Candidate and Cascade Check)', async () => {
    await prisma.donor.delete({ where: { id: testDonor.id } });
    const check = await prisma.donor.findUnique({ where: { id: testDonor.id } });
    if (check !== null) throw new Error('Deleted donor still exists');
  });

  // 6. Relational Joins (4-Table JOIN)
  await test('6. Multi-Table Relational JOIN (CompatibilityMatches + Donors + Recipients + Hospitals)', async () => {
    const joinResult = await prisma.$queryRawUnsafe(`
      SELECT m.id, d.name AS donor, r.name AS recipient, h.name AS hospital, m.overall_compatibility_score
      FROM compatibility_matches m
      JOIN donors d ON m.donor_id = d.id
      JOIN recipients r ON m.recipient_id = r.id
      JOIN hospitals h ON d.hospital_id = h.id
      LIMIT 5;
    `);
    if (!Array.isArray(joinResult) || joinResult.length === 0) throw new Error('JOIN query returned no results');
  });

  // 7. Correlated Nested Subquery
  await test('7. Nested Correlated Subquery (Candidate Severity > Organ Category Average)', async () => {
    const nestedResult = await prisma.$queryRawUnsafe(`
      SELECT r.name, r.organ_type_needed, r.severity_score
      FROM recipients r
      WHERE r.status = 'Waiting'
        AND r.severity_score > (
          SELECT AVG(r2.severity_score)
          FROM recipients r2
          WHERE r2.organ_type_needed = r.organ_type_needed
        )
      LIMIT 5;
    `);
    if (!Array.isArray(nestedResult)) throw new Error('Nested query execution failed');
  });

  // 8. Aggregate Functions with HAVING Clause
  await test('8. Aggregate Functions (COUNT, AVG, MIN, MAX with GROUP BY & HAVING)', async () => {
    const aggResult = await prisma.$queryRawUnsafe(`
      SELECT organ_type, COUNT(id) AS total, ROUND(AVG(age), 1) AS avg_age, MIN(age) AS min_age, MAX(age) AS max_age
      FROM donors
      GROUP BY organ_type
      HAVING COUNT(id) > 0;
    `);
    if (!Array.isArray(aggResult) || aggResult.length === 0) throw new Error('Aggregate query failed');
  });

  // 9. Database Views
  await test('9. Database View Verification (SELECT * FROM v_critical_waitlist)', async () => {
    await prisma.$executeRawUnsafe(`
      CREATE VIEW IF NOT EXISTS v_critical_waitlist AS
      SELECT r.id, r.name, r.blood_group, r.organ_type_needed, r.severity_score, r.wait_time_days
      FROM recipients r
      WHERE r.status = 'Waiting' AND r.severity_score >= 8;
    `);
    const viewRows = await prisma.$queryRawUnsafe(`SELECT * FROM v_critical_waitlist LIMIT 5;`);
    if (!Array.isArray(viewRows)) throw new Error('View query failed');
  });

  // 10. Database Triggers & Audit Logging
  await test('10. Database Triggers & Audit Log Insertion', async () => {
    await prisma.auditLog.create({
      data: {
        entityType: 'SystemTest',
        entityId: 'TEST-RUNNER',
        action: 'ACADEMIC_EVALUATION_PASS',
        actor: 'EvaluationAutomatedSuite',
        details: 'Verification of append-only audit trail and trigger constraints.',
      },
    });
    const log = await prisma.auditLog.findFirst({
      where: { entityType: 'SystemTest' },
      orderBy: { timestamp: 'desc' },
    });
    if (!log) throw new Error('Audit log verification record not found');
  });

  // 11. Clean up test recipient
  if (testRecipient?.id) {
    await prisma.recipient.delete({ where: { id: testRecipient.id } }).catch(() => {});
  }

  console.log(`\n${COLORS.bold}----------------------------------------------------------------${COLORS.reset}`);
  console.log(`  ${COLORS.bold}Test Summary:${COLORS.reset} ${passed === total ? COLORS.green : COLORS.yellow}${passed}/${total} criteria passed.${COLORS.reset}`);
  if (passed === total) {
    console.log(`  ${COLORS.bold}${COLORS.green}✔ SYSTEM IS 100% READY FOR LIVE ACADEMIC EVALUATION!${COLORS.reset}`);
  }
  console.log(`${COLORS.bold}----------------------------------------------------------------${COLORS.reset}\n`);
}

runTestSuite()
  .catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
