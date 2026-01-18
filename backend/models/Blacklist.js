const pool = require('../config/db');

/**
 * Blacklist Model
 * Manages the revocation of authentication tokens (JWTs or Session IDs).
 * Used to enforce server-side logout and prevent replay attacks.
 */
class Blacklist {
  
  /**
   * Checks if a specific token has been revoked.
   * @param {string} token - The token string to verify.
   * @returns {Promise<boolean>} - Returns true if the token exists in the blacklist.
   */
  static async isRevoked(token) {
    const result = await pool.query('SELECT 1 FROM token_blacklist WHERE token = $1', [token]);
    return result.rows.length > 0;
  }

  /**
   * Revokes a token by adding it to the blacklist.
   * @param {string} token - The token string to revoke.
   */
  static async add(token) {
    await pool.query('INSERT INTO token_blacklist (token) VALUES ($1)', [token]);
  }
}

module.exports = Blacklist;