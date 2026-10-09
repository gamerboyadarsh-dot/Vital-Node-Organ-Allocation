/**
 * services/hlaMatching.js
 * Module: Compatibility Engine
 *
 * HLA (Human Leukocyte Antigen) matching using Jaccard similarity.
 * HLA types are stored as JSON arrays of marker strings, e.g. ["A1","B8","DR3"]
 */

const HLA_STRONG_MATCH_THRESHOLD = 0.5; // >= 0.5 is considered a "strong match"

/**
 * Parse HLA type from stored string format (JSON array string) to array.
 * @param {string} hlaString - e.g. '["A1","B8","DR3"]' or 'A1,B8,DR3'
 * @returns {string[]}
 */
function parseHlaType(hlaString) {
  if (!hlaString) return [];
  try {
    // Try JSON parse first
    const parsed = JSON.parse(hlaString);
    if (Array.isArray(parsed)) return parsed.map(s => s.trim().toUpperCase());
  } catch {
    // Fall back to comma-separated
  }
  return hlaString.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
}

/**
 * Compute Jaccard similarity between two HLA marker sets.
 * Jaccard = |intersection| / |union|
 * Score ranges from 0.0 (no overlap) to 1.0 (identical).
 *
 * @param {string} donorHlaString
 * @param {string} recipientHlaString
 * @returns {{ score: number, matchingMarkers: string[], totalUnique: number }}
 */
function computeHlaMatchScore(donorHlaString, recipientHlaString) {
  const donorMarkers = new Set(parseHlaType(donorHlaString));
  const recipientMarkers = new Set(parseHlaType(recipientHlaString));

  if (donorMarkers.size === 0 && recipientMarkers.size === 0) {
    return { score: 1.0, matchingMarkers: [], totalUnique: 0 };
  }

  const intersection = [...donorMarkers].filter(m => recipientMarkers.has(m));
  const union = new Set([...donorMarkers, ...recipientMarkers]);

  const score = union.size === 0 ? 0 : intersection.length / union.size;

  return {
    score: Math.round(score * 1000) / 1000, // 3 decimal places
    matchingMarkers: intersection,
    totalUnique: union.size,
  };
}

/**
 * Is this a "strong" HLA match (score >= threshold)?
 * @param {number} score
 * @returns {boolean}
 */
function isStrongHlaMatch(score) {
  return score >= HLA_STRONG_MATCH_THRESHOLD;
}

module.exports = {
  parseHlaType,
  computeHlaMatchScore,
  isStrongHlaMatch,
  HLA_STRONG_MATCH_THRESHOLD,
};
