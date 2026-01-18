const pool = require('../config/db');

/**
 * User Model
 * Encapsulates all database interactions related to user accounts,
 * including Basic Auth, FIDO2/WebAuthn, and MFA operations.
 */
class User {

  // =========================================================================
  // Core Authentication & Management
  // =========================================================================

  /**
   * Finds a user by email address.
   * Used primarily during the login process to verify credentials.
   * @param {string} email 
   */
  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    return result.rows[0];
  }

  /**
   * Finds a user by ID.
   * Used for session restoration/hydration (e.g., from JWT payload).
   * Selects specific fields to avoid returning sensitive data like passwords.
   * @param {number|string} id 
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT id, name, email, is_admin, has_fido, mfa_secret, current_challenge FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Creates a new user in the database.
   * @param {Object} userData - Contains name, email, password, and isAdmin status.
   */
  static async create({ name, email, password, isAdmin = false }) {
    const result = await pool.query(
      'INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, name, email, is_admin',
      [name, email.toLowerCase().trim(), password, isAdmin]
    );
    return result.rows[0];
  }

  /**
   * Permanently deletes a user from the database.
   * @param {number|string} id 
   */
  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }

  // =========================================================================
  // FIDO2 / WebAuthn Operations
  // =========================================================================

  /**
   * Stores the cryptographic challenge for FIDO2 registration/login.
   * @param {number|string} id 
   * @param {string} challenge 
   */
  static async updateChallenge(id, challenge) {
    await pool.query('UPDATE users SET current_challenge = $1 WHERE id = $2', [challenge, id]);
  }

  /**
   * Enables FIDO2 status for the user and clears the challenge.
   * @param {number|string} id 
   */
  static async enableFido(id) {
    await pool.query('UPDATE users SET has_fido = TRUE, current_challenge = NULL WHERE id = $1', [id]);
  }

  /**
   * Disables FIDO2 status for the user.
   * @param {number|string} id 
   */
  static async disableFido(id) {
    await pool.query('UPDATE users SET has_fido = FALSE WHERE id = $1', [id]);
  }

  // =========================================================================
  // Multi-Factor Authentication (MFA)
  // =========================================================================

  /**
   * Updates the TOTP secret key for the user.
   * Pass `null` as the secret to disable MFA.
   * @param {number|string} id 
   * @param {string|null} secret 
   */
  static async updateMfaSecret(id, secret) {
    await pool.query('UPDATE users SET mfa_secret = $1 WHERE id = $2', [secret, id]);
  }
}

module.exports = User;