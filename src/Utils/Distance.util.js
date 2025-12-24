/**
 * HARSHUU Backend
 * Distance Utility (Production Grade)
 *
 * Uses Haversine formula
 * Safe for pricing, delivery radius, assignment logic
 */

/**
 * ===============================
 * VALIDATE COORDINATES
 * ===============================
 */
function validateCoords(lat, lng) {
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    throw new Error("Invalid latitude or longitude");
  }
}

/**
 * ===============================
 * DEGREES TO RADIANS
 * ===============================
 */
function toRadians(deg) {
  return deg * (Math.PI / 180);
}

/**
 * ===============================
 * CALCULATE DISTANCE (KM)
 * ===============================
 * @returns distance in kilometers (Number)
 */
exports.calculateDistanceKm = (
  fromLat,
  fromLng,
  toLat,
  toLng
) => {
  validateCoords(fromLat, fromLng);
  validateCoords(toLat, toLng);

  const R = 6371; // Earth radius in KM

  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);

  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) *
      Math.sin(dLng / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((R * c).toFixed(2));
};

/**
 * ===============================
 * CHECK DELIVERY RADIUS
 * ===============================
 * @returns true / false
 */
exports.isWithinRadius = ({
  fromLat,
  fromLng,
  toLat,
  toLng,
  maxRadiusKm,
}) => {
  const distance = exports.calculateDistanceKm(
    fromLat,
    fromLng,
    toLat,
    toLng
  );

  return distance <= maxRadiusKm;
};
