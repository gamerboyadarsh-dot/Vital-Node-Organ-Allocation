/**
 * Predicted 5-Year Graft Survival Score — deterministic formula.
 *
 * Base = 70
 * + (hlaMatchScore * 20)          // higher HLA → better survival
 * - (coldIschemicTimeHours * 1.2) // longer CIT → worse outcomes
 * - (recipientAge > 60 ? 10 : 0)  // age risk
 * + (priorFailedMatches === 0 ? 5 : -5) // naive patients do better
 *
 * Clamped to [0, 100].
 */
function computeSurvivalScore({ hlaMatchScore, coldIschemicTimeHours, recipientAge, priorFailedMatches }) {
  let score = 70;
  score += (hlaMatchScore * 20);
  score -= (coldIschemicTimeHours * 1.2);
  score -= (recipientAge > 60 ? 10 : 0);
  score += (priorFailedMatches === 0 ? 5 : -5);
  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
}

function getSurvivalLabel(score) {
  if (score >= 75) return { label: 'Favorable', color: 'emerald' };
  if (score >= 50) return { label: 'Moderate',  color: 'amber'   };
  return              { label: 'At Risk',    color: 'rose'    };
}

module.exports = { computeSurvivalScore, getSurvivalLabel };
