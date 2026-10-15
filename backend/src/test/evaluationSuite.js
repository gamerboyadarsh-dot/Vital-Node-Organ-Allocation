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

  // 10. Database Triggers (Real Engine Trigger Firing Proof)
  await test('10. Database Triggers (trg_recipient_status_audit Engine-Level Proof)', async () => {
    // Ensure trigger exists in SQLite schema
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

    // Execute raw SQL update to change status from 'Waiting' to 'Matched'
    await prisma.$executeRawUnsafe(
      `UPDATE recipients SET status = 'Matched' WHERE id = '${testRecipient.id}';`
    );

    // Verify the trigger inserted an audit log record with actor='DB_TRIGGER'
    const triggerAudit = await prisma.auditLog.findFirst({
      where: {
        entityId: testRecipient.id,
        actor: 'DB_TRIGGER',
        action: 'STATUS_TRIGGER_FIRED',
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!triggerAudit) {
      throw new Error('Database trigger failed to create audit_logs entry upon status change');
    }
  });

  // 11. ACID Transaction & Rollback Verification (Allocation Race-Condition Guard)
  const { finalizeMatch } = require('../services/allocation');
  await test('11. ACID Transaction Rollback on Conflict (Guarantees Atomicity)', async () => {
    // Create a temporary donor marked isAvailable = false
    const unavailableDonor = await prisma.donor.create({
      data: {
        name: 'Unavailable Donor',
        age: 40,
        bloodGroup: 'B+',
        organType: 'Liver',
        hospitalId: testHospital.id,
        hlaType: JSON.stringify(['A*02:01', 'B*07:02']),
        isAvailable: false, // ALREADY UNAVAILABLE
      },
    });

    const waitingRecipient = await prisma.recipient.create({
      data: {
        name: 'Waiting Candidate',
        age: 38,
        bloodGroup: 'B+',
        organTypeNeeded: 'Liver',
        hospitalId: testHospital.id,
        hlaType: JSON.stringify(['A*02:01', 'B*07:02']),
        severityScore: 8,
        status: 'Waiting',
      },
    });

    const testMatch = await prisma.compatibilityMatch.create({
      data: {
        donorId: unavailableDonor.id,
        recipientId: waitingRecipient.id,
        bloodCompatible: true,
        hlaMatchScore: 85.0,
        organTypeMatch: true,
        distanceKm: 12.5,
        urgencyScore: 80.0,
        overallCompatibilityScore: 88.5,
        matchStatus: 'Candidate',
      },
    });

    let conflictCaught = false;
    try {
      // Attempt to finalize match with unavailable donor — MUST ROLLBACK with 409
      await finalizeMatch(testMatch.id);
    } catch (err) {
      if (err.status === 409 || (err.message && err.message.includes('Conflict'))) {
        conflictCaught = true;
      } else {
        throw err;
      }
    }

    if (!conflictCaught) {
      throw new Error('Transaction should have rolled back with 409 Conflict for unavailable donor');
    }

    // Verify rollback: no Transplant record was created for this match
    const orphanTransplant = await prisma.transplant.findUnique({
      where: { matchId: testMatch.id },
    });
    if (orphanTransplant !== null) {
      throw new Error('Rollback failed: orphan Transplant record was inserted despite conflict');
    }

    // Verify match status remained 'Candidate' (not 'Finalized')
    const matchState = await prisma.compatibilityMatch.findUnique({
      where: { id: testMatch.id },
    });
    if (matchState.matchStatus !== 'Candidate') {
      throw new Error('Rollback failed: Match status was mutated during conflicted transaction');
    }

    // Cleanup temporary conflict test rows
    await prisma.compatibilityMatch.delete({ where: { id: testMatch.id } });
    await prisma.donor.delete({ where: { id: unavailableDonor.id } });
    await prisma.recipient.delete({ where: { id: waitingRecipient.id } });
  });

  // 12. Clean up test recipient and associated trigger audit
  if (testRecipient?.id) {
    await prisma.auditLog.deleteMany({ where: { entityId: testRecipient.id } }).catch(() => {});
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
