// backend/utils/index.js

/**
 * Calculates the distance between two coordinates in kilometers.
 * @param {number} lat1 Latitude of the first point.
 * @param {number} lon1 Longitude of the first point.
 * @param {number} lat2 Latitude of the second point.
 * @param {number} lon2 Longitude of the second point.
 * @returns {number} The distance in kilometers.
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Parses the locale from the query parameters or the Accept-Language header.
 * Defaults to 'en' if not provided.
 * @param {Object} req - Express request object.
 * @returns {string} The parsed locale code (e.g., 'en', 'hi').
 */
function getLocale(req) {
  if (req.query && req.query.locale) {
    return req.query.locale;
  }

  const acceptLanguage = req.headers && req.headers['accept-language'];
  if (!acceptLanguage) {
    return 'en';
  }

  // Extract the primary language code from "en-US,en;q=0.9" -> "en"
  try {
    const primaryLang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase().trim();
    return primaryLang || 'en';
  } catch (error) {
    return 'en';
  }
}

module.exports = {
  getDistance,
  getLocale,
};
