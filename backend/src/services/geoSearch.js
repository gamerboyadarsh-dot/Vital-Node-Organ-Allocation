/**
 * services/geoSearch.js
 * Module: Proximity Search
 *
 * Haversine formula implementation for computing great-circle distance
 * between two lat/lng coordinate pairs (no external geo library required).
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians.
 * @param {number} deg
 * @returns {number}
 */
function toRadians(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Compute Haversine distance between two coordinates.
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in kilometers (rounded to 2 decimal places)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Filter and sort recipients by distance from a donor's hospital.
 * @param {{ latitude: number, longitude: number }} donorHospital
 * @param {Array<{ recipient: object, hospital: { latitude: number, longitude: number } }>} candidates
 * @param {number} radiusKm - Maximum distance filter (default 500km)
 * @returns {Array} Candidates sorted by distance ascending, within radius
 */
function filterByRadius(donorHospital, candidates, radiusKm = 500) {
  return candidates
    .map(c => ({
      ...c,
      distanceKm: haversineDistance(
        donorHospital.latitude,
        donorHospital.longitude,
        c.hospital.latitude,
        c.hospital.longitude
      ),
    }))
    .filter(c => c.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

module.exports = {
  haversineDistance,
  filterByRadius,
  EARTH_RADIUS_KM,
};
