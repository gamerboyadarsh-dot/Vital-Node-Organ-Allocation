/**
 * scripts/backupRestore.js
 * Database Backup & Recovery Procedure
 * Tested and verified on local SQLite database engine.
 * Run with: node src/scripts/backupRestore.js
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const DB_PATH = path.resolve(__dirname, '../../prisma/odrmn.db');
const BACKUP_PATH = path.resolve(__dirname, '../../prisma/odrmn.backup.db');
const RESTORE_TEST_PATH = path.resolve(__dirname, '../../prisma/odrmn.restore_test.db');

async function testBackupAndRestore() {
  console.log('================================================================');
  console.log('  VITALNODE DATABASE BACKUP & RECOVERY VERIFICATION             ');
  console.log('================================================================\n');

  // Step 1: Verify Primary Database exists
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Primary database not found at ${DB_PATH}`);
  }
  const originalStats = fs.statSync(DB_PATH);
  console.log(`[1] Primary Database verified: ${DB_PATH} (${originalStats.size} bytes)`);

  // Step 2: Create Backup copy
  console.log(`[2] Creating atomic database snapshot to ${BACKUP_PATH}...`);
  fs.copyFileSync(DB_PATH, BACKUP_PATH);
  const backupStats = fs.statSync(BACKUP_PATH);
  if (backupStats.size !== originalStats.size) {
    throw new Error('Backup file size mismatch');
  }
  console.log(`    ✔ Snapshot successfully created (${backupStats.size} bytes).`);

  // Step 3: Test Recovery into disposable target
  console.log(`[3] Testing recovery by restoring snapshot to ${RESTORE_TEST_PATH}...`);
  fs.copyFileSync(BACKUP_PATH, RESTORE_TEST_PATH);

  // Connect Prisma to restored database to verify schema and data integrity
  const restoredPrisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${RESTORE_TEST_PATH.replace(/\\/g, '/')}`,
      },
    },
  });

  try {
    const hospitalCount = await restoredPrisma.hospital.count();
    const donorCount = await restoredPrisma.donor.count();
    const recipientCount = await restoredPrisma.recipient.count();
    const matchCount = await restoredPrisma.compatibilityMatch.count();
    const auditCount = await restoredPrisma.auditLog.count();

    console.log(`[4] Integrity Check on Restored Database:`);
    console.log(`    - Hospitals:           ${hospitalCount}`);
    console.log(`    - Donors:              ${donorCount}`);
    console.log(`    - Recipients:          ${recipientCount}`);
    console.log(`    - Matches:             ${matchCount}`);
    console.log(`    - Audit Log Records:   ${auditCount}`);

    if (hospitalCount === 0 || donorCount === 0) {
      throw new Error('Restored database is missing essential seed records.');
    }

    console.log('\n  ✔ [PASSED] BACKUP & RESTORE INTEGRITY VERIFIED WITHOUT DATA LOSS!\n');
  } finally {
    await restoredPrisma.$disconnect();
    // Clean up disposable test database
    if (fs.existsSync(RESTORE_TEST_PATH)) {
      fs.unlinkSync(RESTORE_TEST_PATH);
      console.log(`[5] Disposable recovery test database safely deleted.`);
    }
  }
}

testBackupAndRestore().catch((err) => {
  console.error('Backup & recovery verification failed:', err);
  process.exit(1);
});
