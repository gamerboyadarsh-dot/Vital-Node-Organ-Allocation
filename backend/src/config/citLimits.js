/**
 * Organ-specific Cold Ischemic Time (CIT) hard limits (in hours).
 * Source: UNOS/NOTTO clinical guidelines.
 * If computed CIT > limit → match is automatically rejected.
 */
const CIT_LIMITS_HOURS = {
  Heart:    6,
  Lung:     8,
  Liver:    24,
  Kidney:   36,
  Pancreas: 20,
  Cornea:   168,
};

/**
 * Warning threshold: alert when CIT > this fraction of the limit.
 * e.g. 0.75 = alert when 75% of time window has elapsed.
 */
const CIT_WARNING_FRACTION = 0.75;

/**
 * Estimate CIT hours from distance using logistics model.
 * Formula: (distanceKm / 80) + 1.5
 * — 80 km/h effective air+ground transfer speed
 * — 1.5h fixed preparation overhead
 */
function estimateCitHours(distanceKm) {
  return (distanceKm / 80) + 1.5;
}

/**
 * Returns true if estimated CIT exceeds the organ's hard limit.
 */
function isCitExceeded(distanceKm, organType) {
  const limit = CIT_LIMITS_HOURS[organType];
  if (!limit) return false;
  return estimateCitHours(distanceKm) > limit;
}

/**
 * Returns the CIT warning level for a given match.
 * 'ok' | 'warning' | 'exceeded'
 */
function getCitStatus(distanceKm, organType) {
  const limit = CIT_LIMITS_HOURS[organType];
  if (!limit) return 'ok';
  const cit = estimateCitHours(distanceKm);
  if (cit > limit) return 'exceeded';
  if (cit > limit * CIT_WARNING_FRACTION) return 'warning';
  return 'ok';
}

module.exports = { CIT_LIMITS_HOURS, CIT_WARNING_FRACTION, estimateCitHours, isCitExceeded, getCitStatus };
