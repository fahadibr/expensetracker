const crypto = require('crypto');

/**
 * Generate a secure random token for email verification or password reset.
 * @returns {string} A hex-encoded random token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get token expiration date (default 24 hours from now).
 * @param {number} hours - Hours until expiration
 * @returns {Date}
 */
function getTokenExpiry(hours = 24) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

module.exports = { generateToken, getTokenExpiry };
