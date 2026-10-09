/**
 * services/allocation.js
 * Module: Matching / Allocation Transaction
 *
 * CRITICAL ACID SECTION — This module handles the finalization of a donor-recipient match.
 *
 * RACE CONDITION PREVENTION:
 * Without a transaction, two staff members could simultaneously finalize two different
 * matches for the same donor (or same recipient), resulting in one organ being matched
 * to two recipients (double allocation). This is the "lost update" or "phantom write"
 * problem in concurrent systems.
 *
 * SOLUTION: We use Prisma's $transaction with serializable-like semantics.
 * INSIDE the transaction, we re-fetch and re-check donor.isAvailable and
 * recipient.status BEFORE making any changes. If either has changed since the
 * staff member loaded the page, we ROLLBACK with a 409 Conflict response.
 * This guarantees "one organ → one recipient" atomically.
 *
 * SQLite note: SQLite uses file-level locking, so concurrent transactions are
 * serialized at the DB level. In PostgreSQL, use SELECT ... FOR UPDATE to
 * lock the specific rows being checked.
 */

const prisma = require('../db/prismaClient');
const { logMatchFinalized, logMatchRejected, logTransplantCompleted } = require('./auditLogger');

/**
 * Finalize a match — the critical ACID allocation transaction.
 *
 * Steps (all within a single transaction):
 *  1. Re-check donor.isAvailable === true (inside transaction, with re-fetch)
 *  2. Re-check recipient.status === 'Waiting' (inside transaction, with re-fetch)
 *  3. If either fails → ROLLBACK → throw 409 ConflictError
 *  4. Set donor.isAvailable = false
 *  5. Set recipient.status = 'Matched'
 *  6. Set this CompatibilityMatch.matchStatus = 'Finalized'
 *  7. Reject all other CompatibilityMatch rows for this donor
 *  8. Insert Transplant row (outcome = 'Pending')
 *  9. Insert AuditLog row (MATCH_FINALIZED)
 * 10. COMMIT
 *
 * @param {string} matchId
 * @returns {Promise<{ transplant: object, match: object }>}
 * @throws {{ status: 409, message: string }} on conflict
 */
async function finalizeMatch(matchId) {
  return await prisma.$transaction(async (tx) => {
    // ── Step 0: Fetch the match with related entities ──────────────────────
    const match = await tx.compatibilityMatch.findUnique({
      where: { id: matchId },
      include: {
        donor: true,
        recipient: true,
      },
    });

    if (!match) {
      const err = new Error(`Match ${matchId} not found`);
      err.status = 404;
      throw err;
    }

    if (match.matchStatus === 'Finalized') {
      const err = new Error('This match has already been finalized');
      err.status = 409;
      throw err;
    }

    // ── Step 1 & 2: Re-check availability INSIDE transaction ───────────────
    // This is the race-condition guard.
    // If running under PostgreSQL (process.env.DB_PROVIDER === 'postgresql'),
    // we acquire explicit row-level locks via SELECT ... FOR UPDATE.
    // Under SQLite, transactions use database file-level locking natively.
    if (process.env.DB_PROVIDER === 'postgresql') {
      try {
        await tx.$queryRaw`SELECT id FROM donors WHERE id = ${match.donorId} FOR UPDATE`;
        await tx.$queryRaw`SELECT id FROM recipients WHERE id = ${match.recipientId} FOR UPDATE`;
      } catch (lockErr) {
        console.warn('[Postgres Lock Warning]', lockErr.message);
      }
    }

    const donor = await tx.donor.findUnique({ where: { id: match.donorId } });
    const recipient = await tx.recipient.findUnique({ where: { id: match.recipientId } });

    if (!donor.isAvailable) {
      const err = new Error(
        `Conflict: Donor ${donor.name} is no longer available. ` +
        `They may have been matched by another request.`
      );
      err.status = 409;
      throw err;
    }

    if (recipient.status !== 'Waiting') {
      const err = new Error(
        `Conflict: Recipient ${recipient.name} is no longer in Waiting status (current: ${recipient.status}). ` +
        `They may have been matched by another request.`
      );
      err.status = 409;
      throw err;
    }

    // ── Step 4: Mark donor as unavailable ──────────────────────────────────
    await tx.donor.update({
      where: { id: donor.id },
      data: { isAvailable: false },
    });

    // ── Step 5: Mark recipient as Matched ──────────────────────────────────
    await tx.recipient.update({
      where: { id: recipient.id },
      data: { status: 'Matched' },
    });

    // ── Step 6: Finalize this match ────────────────────────────────────────
    const finalizedMatch = await tx.compatibilityMatch.update({
      where: { id: matchId },
      data: { matchStatus: 'Finalized' },
    });

    // ── Step 7: Reject all other candidate matches for this donor ──────────
    const rejectedMatches = await tx.compatibilityMatch.findMany({
      where: {
        donorId: donor.id,
        id: { not: matchId },
        matchStatus: { in: ['Candidate', 'Shortlisted'] },
      },
    });

    await tx.compatibilityMatch.updateMany({
      where: {
        donorId: donor.id,
        id: { not: matchId },
        matchStatus: { in: ['Candidate', 'Shortlisted'] },
      },
      data: { matchStatus: 'Rejected' },
    });

    // Log rejections
    for (const rm of rejectedMatches) {
      await logMatchRejected(
        rm.id,
        `Auto-rejected: Donor ${donor.name} was finalized with Recipient ${recipient.name}`,
        tx
      );
    }

    // ── Step 8: Insert Transplant row ──────────────────────────────────────
    const transplant = await tx.transplant.create({
      data: {
        matchId,
        donorId: donor.id,
        recipientId: recipient.id,
        outcome: 'Pending',
        notes: `Finalized match between ${donor.name} and ${recipient.name}`,
      },
    });

    // ── Step 9: Write audit log ────────────────────────────────────────────
    await logMatchFinalized(finalizedMatch, donor, recipient, tx);

    // ── Step 10: COMMIT (implicit at end of $transaction callback) ─────────
    return { transplant, match: finalizedMatch };
  });
}

/**
 * Reject a match manually (not via full finalization).
 * @param {string} matchId
 * @param {string} reason
 * @returns {Promise<object>}
 */
async function rejectMatch(matchId, reason) {
  return await prisma.$transaction(async (tx) => {
    const match = await tx.compatibilityMatch.findUnique({ where: { id: matchId } });
    if (!match) {
      const err = new Error(`Match ${matchId} not found`);
      err.status = 404;
      throw err;
    }
    if (match.matchStatus === 'Finalized') {
      const err = new Error('Cannot reject a finalized match');
      err.status = 400;
      throw err;
    }

    const updated = await tx.compatibilityMatch.update({
      where: { id: matchId },
      data: { matchStatus: 'Rejected' },
    });

    await logMatchRejected(matchId, reason || 'Manually rejected', tx);

    return updated;
  });
}

/**
 * Update transplant outcome (Success / Failed).
 * If Failed:
 *  - Increment recipient.priorFailedMatches
 *  - Revert recipient.status back to 'Waiting' (re-enters the pool)
 *  - Both inside a transaction, both logged
 *
 * @param {string} transplantId
 * @param {'Success'|'Failed'} outcome
 * @param {string} [notes]
 * @returns {Promise<object>}
 */
async function updateTransplantOutcome(transplantId, outcome, notes) {
  return await prisma.$transaction(async (tx) => {
    const transplant = await tx.transplant.findUnique({
      where: { id: transplantId },
      include: { recipient: true },
    });

    if (!transplant) {
      const err = new Error(`Transplant ${transplantId} not found`);
      err.status = 404;
      throw err;
    }

    // Update the transplant record
    const updated = await tx.transplant.update({
      where: { id: transplantId },
      data: {
        outcome,
        notes: notes || transplant.notes,
      },
    });

    if (outcome === 'Failed') {
      // Increment failed matches counter and re-enter recipient into pool
      await tx.recipient.update({
        where: { id: transplant.recipientId },
        data: {
          priorFailedMatches: { increment: 1 },
          status: 'Waiting', // Re-enter the priority waitlist
        },
      });
    } else if (outcome === 'Success') {
      // Mark recipient as Transplanted
      await tx.recipient.update({
        where: { id: transplant.recipientId },
        data: { status: 'Transplanted' },
      });
    }

    await logTransplantCompleted(updated, outcome, tx);

    return updated;
  });
}

module.exports = {
  finalizeMatch,
  rejectMatch,
  updateTransplantOutcome,
};
