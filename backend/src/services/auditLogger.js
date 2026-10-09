/**
 * services/auditLogger.js
 * Module: Consent & Audit Trail
 *
 * Append-only audit log helper. This module ONLY ever inserts rows.
 * There are NO update or delete operations against the audit_logs table
 * anywhere in the application layer — enforced by design.
 */

const prisma = require('../db/prismaClient');

/**
 * Write a single audit log entry.
 * This is the ONLY function that writes to AuditLog.
 *
 * @param {object} params
 * @param {string} params.entityType - "Donor" | "Recipient" | "Match" | "Transplant"
 * @param {string} params.entityId   - ID of the affected entity
 * @param {string} params.action     - e.g. "REGISTERED", "MATCH_FINALIZED"
 * @param {string} params.actor      - hospital/staff name
 * @param {object|string} params.details - free-form context (object will be JSON.stringify'd)
 * @param {object} [tx]              - optional Prisma transaction client
 * @returns {Promise<object>} Created AuditLog record
 */
async function writeAuditLog({ entityType, entityId, action, actor, details }, tx) {
  const client = tx || prisma;
  const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details);

  return client.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      actor,
      details: detailsStr,
    },
  });
}

/**
 * Convenience: log a donor registration event.
 */
async function logDonorRegistered(donor, tx) {
  return writeAuditLog(
    {
      entityType: 'Donor',
      entityId: donor.id,
      action: 'REGISTERED',
      actor: donor.hospitalId,
      details: `Donor ${donor.name} registered for ${donor.organType} donation. Blood group: ${donor.bloodGroup}`,
    },
    tx
  );
}

/**
 * Convenience: log a recipient registration event.
 */
async function logRecipientRegistered(recipient, tx) {
  return writeAuditLog(
    {
      entityType: 'Recipient',
      entityId: recipient.id,
      action: 'REGISTERED',
      actor: recipient.hospitalId,
      details: `Recipient ${recipient.name} registered needing ${recipient.organTypeNeeded}. Severity: ${recipient.severityScore}/10`,
    },
    tx
  );
}

/**
 * Convenience: log consent status change.
 */
async function logConsentChange(donor, newStatus, actor, tx) {
  return writeAuditLog(
    {
      entityType: 'Donor',
      entityId: donor.id,
      action: 'CONSENT_GIVEN',
      actor: actor || donor.hospitalId,
      details: `Donor ${donor.name} consent status changed to: ${newStatus}`,
    },
    tx
  );
}

/**
 * Convenience: log a compatibility match batch creation.
 */
async function logMatchCreated(donorId, matchCount, actor, tx) {
  return writeAuditLog(
    {
      entityType: 'Match',
      entityId: donorId,
      action: 'MATCH_CREATED',
      actor: actor || 'System',
      details: `Compatibility engine run for donor ${donorId}: ${matchCount} candidate matches found`,
    },
    tx
  );
}

/**
 * Convenience: log a match finalization.
 */
async function logMatchFinalized(match, donor, recipient, tx) {
  return writeAuditLog(
    {
      entityType: 'Match',
      entityId: match.id,
      action: 'MATCH_FINALIZED',
      actor: 'Allocation System',
      details: `Donor ${donor.name} (${donor.bloodGroup}) matched to Recipient ${recipient.name} (${recipient.bloodGroup}). Distance: ${match.distanceKm}km, HLA Score: ${match.hlaMatchScore}, Overall: ${match.overallCompatibilityScore}`,
    },
    tx
  );
}

/**
 * Convenience: log a match rejection.
 */
async function logMatchRejected(matchId, reason, tx) {
  return writeAuditLog(
    {
      entityType: 'Match',
      entityId: matchId,
      action: 'MATCH_REJECTED',
      actor: 'Allocation System',
      details: reason || 'Match rejected',
    },
    tx
  );
}

/**
 * Convenience: log a transplant outcome.
 */
async function logTransplantCompleted(transplant, outcome, tx) {
  return writeAuditLog(
    {
      entityType: 'Transplant',
      entityId: transplant.id,
      action: 'TRANSPLANT_COMPLETED',
      actor: 'Clinical Staff',
      details: `Transplant ${transplant.id} outcome: ${outcome}. ${transplant.notes || ''}`,
    },
    tx
  );
}

module.exports = {
  writeAuditLog,
  logDonorRegistered,
  logRecipientRegistered,
  logConsentChange,
  logMatchCreated,
  logMatchFinalized,
  logMatchRejected,
  logTransplantCompleted,
};
