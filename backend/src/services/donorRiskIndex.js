/**
 * Donor Risk Index (DRI) — deterministic composite risk score.
 *
 * DRI = 1.0 (baseline)
 *     + 0.3 if age > 50
 *     + 0.4 if age > 65
 *     + 0.2 if causeOfDeath == 'Stroke'
 *     - 0.1 if causeOfDeath == 'Trauma'
 *
 * Risk tiers:
 *   < 1.3  = Low
 *   1.3–1.7 = Elevated
 *   > 1.7  = High
 */

const DRI_THRESHOLDS = { LOW: 1.3, HIGH: 1.7 };

function computeDonorRiskIndex({ age, causeOfDeath }) {
  let dri = 1.0;
  if (age > 50)  dri += 0.3;
  if (age > 65)  dri += 0.4;
  if (causeOfDeath === 'Stroke')  dri += 0.2;
  if (causeOfDeath === 'Trauma')  dri -= 0.1;
  return Math.round(dri * 100) / 100; // 2 decimal places
}

function getDriLabel(dri) {
  if (!dri) return 'Unknown';
  if (dri < DRI_THRESHOLDS.LOW)  return 'Low';
  if (dri <= DRI_THRESHOLDS.HIGH) return 'Elevated';
  return 'High';
}

function getDriColor(dri) {
  if (!dri) return 'gray';
  if (dri < DRI_THRESHOLDS.LOW)  return 'emerald';
  if (dri <= DRI_THRESHOLDS.HIGH) return 'amber';
  return 'rose';
}

module.exports = { computeDonorRiskIndex, getDriLabel, getDriColor, DRI_THRESHOLDS };
