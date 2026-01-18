const pool = require('../config/db');

class User {
  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, name, email, is_admin, has_fido, mfa_secret, current_challenge FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async create({ name, email, password, isAdmin = false }) {
    const result = await pool.query(
      'INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email.toLowerCase().trim(), password, isAdmin]
    );
    return result.rows[0];
  }

  static async updateChallenge(id, challenge) {
    await pool.query('UPDATE users SET current_challenge = $1 WHERE id = $2', [challenge, id]);
  }

  static async enableFido(id) {
    await pool.query('UPDATE users SET has_fido = TRUE, current_challenge = NULL WHERE id = $1', [id]);
  }

  static async disableFido(id) {
    await pool.query('UPDATE users SET has_fido = FALSE WHERE id = $1', [id]);
  }

  static async updateMfaSecret(id, secret) {
    await pool.query('UPDATE users SET mfa_secret = $1 WHERE id = $2', [secret, id]);
  }
  
  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

module.exports = User;