/**
 * services/urgencyScoring.js
 * Module: Urgency & Priority Scoring
 *
 * Computes a transparent, auditable urgency score for recipients.
 * Formula:
 *   urgency_score = (severity_score * W_SEVERITY)
 *                 + (normalized_wait_time * W_WAIT)
 *                 + (prior_failed_matches * W_FAILED)
 *
 * Where:
 *   normalized_wait_time = min(wait_time_days / 365, 1) * 10
 *   (scales wait time to 0-10 to be comparable with severity_score)
 *
 * Weights are exposed as named constants so they are transparent and auditable —
 * directly addressing the "no informal ranking" problem in organ allocation.
 */

// ============================================================
// CONFIGURABLE WEIGHTS (exposed for transparency / auditability)
// ============================================================
const W_SEVERITY = 0.5;   // Weight for severity score (clinical urgency, 1-10)
const W_WAIT = 0.3;       // Weight for normalized wait time (fairness)
const W_FAILED = 0.2;     // Weight for prior failed matches (fairness to long-waiters)

const MAX_WAIT_DAYS = 365; // Normalization cap: 1 year maps to 10

/**
 * Normalize wait time to a 0-10 scale.
 * @param {number} waitTimeDays
 * @returns {number}
 */
function normalizeWaitTime(waitTimeDays) {
  return Math.min(waitTimeDays / MAX_WAIT_DAYS, 1) * 10;
}

/**
 * Compute urgency score for a single recipient.
 * @param {{ severityScore: number, waitTimeDays: number, priorFailedMatches: number }} recipient
 * @returns {{ urgencyScore: number, breakdown: object }}
 */
function computeUrgencyScore(recipient) {
  const { severityScore, waitTimeDays, priorFailedMatches } = recipient;

  const normalizedWait = normalizeWaitTime(waitTimeDays);
  const severityContrib = severityScore * W_SEVERITY;
  const waitContrib = normalizedWait * W_WAIT;
  const failedContrib = priorFailedMatches * W_FAILED;

  const urgencyScore = Math.round((severityContrib + waitContrib + failedContrib) * 1000) / 1000;

  return {
    urgencyScore,
    breakdown: {
      severityContrib: Math.round(severityContrib * 1000) / 1000,
      waitContrib: Math.round(waitContrib * 1000) / 1000,
      failedContrib: Math.round(failedContrib * 1000) / 1000,
      normalizedWaitTime: Math.round(normalizedWait * 1000) / 1000,
    },
  };
}

/**
 * Sort a list of recipients by urgency score descending.
 * @param {Array} recipients - Array with severityScore, waitTimeDays, priorFailedMatches
 * @returns {Array} Sorted array with urgencyScore added
 */
function sortByUrgency(recipients) {
  return recipients
    .map(r => ({
      ...r,
      ...computeUrgencyScore(r),
    }))
    .sort((a, b) => b.urgencyScore - a.urgencyScore);
}

module.exports = {
  computeUrgencyScore,
  sortByUrgency,
  normalizeWaitTime,
  W_SEVERITY,
  W_WAIT,
  W_FAILED,
  MAX_WAIT_DAYS,
};
