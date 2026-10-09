/**
 * services/compatibilityEngine.js
 * Module: Compatibility Matching Engine
 *
 * For a given donor, scans all waiting recipients and computes a
 * compatibility score for each, then persists CompatibilityMatch rows.
 */

const prisma = require('../db/prismaClient');
const { isBloodCompatible } = require('./bloodCompatibility');
const { computeHlaMatchScore } = require('./hlaMatching');
const { haversineDistance } = require('./geoSearch');
const { computeUrgencyScore } = require('./urgencyScoring');
const { logMatchCreated } = require('./auditLogger');

// ============================================================
// SCORING WEIGHTS (named constants — easy to tune and explain)
// ============================================================
const WEIGHT_BLOOD_COMPATIBLE = 40;  // Blood compatibility (boolean) contributes up to 40 pts
const WEIGHT_HLA = 30;               // HLA match score (0-1) contributes up to 30 pts
const WEIGHT_ORGAN_MATCH = 20;       // Organ type match (boolean) contributes up to 20 pts
const WEIGHT_DISTANCE = 10;          // Distance contributes up to 10 pts (closer = better)
const DISTANCE_DECAY_FACTOR = 50;    // Every 50km halves the distance score contribution

/**
 * Compute the overall compatibility score for a donor-recipient pair.
 * Score range: 0 - 100
 *
 * Formula:
 *   score = (bloodCompatible ? 40 : 0)
 *         + (hlaMatchScore * 30)
 *         + (organTypeMatch ? 20 : 0)
 *         + max(0, 10 - distanceKm / 50)
 *
 * @returns {number} 0-100
 */
function computeOverallScore({ bloodCompatible, hlaMatchScore, organTypeMatch, distanceKm }) {
  const bloodPts = bloodCompatible ? WEIGHT_BLOOD_COMPATIBLE : 0;
  const hlaPts = hlaMatchScore * WEIGHT_HLA;
  const organPts = organTypeMatch ? WEIGHT_ORGAN_MATCH : 0;
  const distPts = Math.max(0, WEIGHT_DISTANCE - distanceKm / DISTANCE_DECAY_FACTOR);

  const total = bloodPts + hlaPts + organPts + distPts;
  return Math.round(total * 100) / 100;
}

/**
 * Run the compatibility engine for a single donor.
 * - Finds all waiting recipients needing the same organ type
 * - Computes blood, HLA, distance, urgency, and overall scores
 * - Upserts CompatibilityMatch rows for blood-compatible candidates
 * - Logs a MATCH_CREATED audit entry
 *
 * @param {string} donorId
 * @returns {Promise<Array>} Array of created/updated CompatibilityMatch records
 */
const { estimateCitHours, isCitExceeded, CIT_LIMITS_HOURS } = require('../config/citLimits');
const { computeSurvivalScore } = require('./survivalScore');

/**
 * Run the compatibility engine for a single donor.
 * Computes blood, HLA, distance, CIT, urgency, survival, and overall scores.
 * Gathers exclusion diagnostics to explain zero-match or reduced-match states.
 *
 * @param {string} donorId
 * @returns {Promise<{ results: Array, diagnostics: object }>}
 */
async function runCompatibilityEngine(donorId) {
  const donor = await prisma.donor.findUnique({
    where: { id: donorId },
    include: { hospital: true },
  });

  if (!donor) throw new Error(`Donor ${donorId} not found`);
  if (!donor.isAvailable) throw new Error(`Donor ${donorId} is not available`);

  // All waiting recipients across registry
  const allWaiting = await prisma.recipient.findMany({
    where: { status: 'Waiting' },
    include: { hospital: true },
  });

  const diagnostics = {
    totalWaiting: allWaiting.length,
    excludedByOrgan: 0,
    excludedByBlood: 0,
    excludedByCit: 0,
    eligibleCandidates: 0,
    organType: donor.organType,
    citLimitHours: CIT_LIMITS_HOURS[donor.organType] || 24,
  };

  const results = [];

  for (const recipient of allWaiting) {
    if (recipient.organTypeNeeded !== donor.organType) {
      diagnostics.excludedByOrgan++;
      continue;
    }

    const bloodCompatible = isBloodCompatible(donor.bloodGroup, recipient.bloodGroup);
    if (!bloodCompatible) {
      diagnostics.excludedByBlood++;
      continue;
    }

    const distanceKm = haversineDistance(
      donor.hospital.latitude,
      donor.hospital.longitude,
      recipient.hospital.latitude,
      recipient.hospital.longitude
    );

    const citHours = estimateCitHours(distanceKm);
    const citExceeded = isCitExceeded(distanceKm, donor.organType);

    if (citExceeded) {
      diagnostics.excludedByCit++;
    }

    const { score: hlaMatchScore } = computeHlaMatchScore(donor.hlaType, recipient.hlaType);
    const organTypeMatch = true;
    const { urgencyScore } = computeUrgencyScore(recipient);

    const overallCompatibilityScore = computeOverallScore({
      bloodCompatible: true,
      hlaMatchScore,
      organTypeMatch,
      distanceKm,
    });

    const survival = computeSurvivalScore({
      hlaMatchScore,
      coldIschemicTimeHours: citHours,
      recipientAge: recipient.age,
      priorFailedMatches: recipient.priorFailedMatches,
    });

    const matchStatus = citExceeded ? 'Rejected' : 'Candidate';

    const match = await prisma.compatibilityMatch.upsert({
      where: {
        unique_donor_recipient: {
          donorId: donor.id,
          recipientId: recipient.id,
        },
      },
      update: {
        bloodCompatible: true,
        hlaMatchScore,
        organTypeMatch,
        distanceKm,
        urgencyScore,
        overallCompatibilityScore,
        coldIschemicTimeHours: citHours,
        predictedGraftSurvival5yr: survival,
        citExceeded,
        matchStatus,
      },
      create: {
        donorId: donor.id,
        recipientId: recipient.id,
        bloodCompatible: true,
        hlaMatchScore,
        organTypeMatch,
        distanceKm,
        urgencyScore,
        overallCompatibilityScore,
        coldIschemicTimeHours: citHours,
        predictedGraftSurvival5yr: survival,
        citExceeded,
        matchStatus,
      },
    });

    if (!citExceeded) {
      diagnostics.eligibleCandidates++;
    }
    results.push({ match, recipient, donor });
  }

  // Write audit log
  await logMatchCreated(donorId, results.length, 'Compatibility Engine v3');

  return { results, diagnostics };
}

/**
 * Get ranked candidates for a donor with diagnostics.
 *
 * @param {string} donorId
 * @returns {Promise<{ matches: Array, diagnostics: object }>}
 */
async function getRankedMatches(donorId) {
  const { diagnostics } = await runCompatibilityEngine(donorId);

  const matches = await prisma.compatibilityMatch.findMany({
    where: {
      donorId,
      matchStatus: { in: ['Candidate', 'Shortlisted'] },
      citExceeded: false,
    },
    include: {
      recipient: { include: { hospital: true } },
      donor: { include: { hospital: true } },
    },
    orderBy: [
      { overallCompatibilityScore: 'desc' },
      { urgencyScore: 'desc' },
    ],
  });

  return { matches, diagnostics };
}

module.exports = {
  runCompatibilityEngine,
  getRankedMatches,
  computeOverallScore,
  WEIGHT_BLOOD_COMPATIBLE,
  WEIGHT_HLA,
  WEIGHT_ORGAN_MATCH,
  WEIGHT_DISTANCE,
  DISTANCE_DECAY_FACTOR,
};
