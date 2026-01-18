const pool = require('../config/db');

class Authenticator {
  static async findByCredentialId(credentialId) {
    const result = await pool.query('SELECT * FROM authenticators WHERE credential_id = $1', [credentialId]);
    return result.rows[0];
  }

  static async getUserAuthenticators(userId) {
    const result = await pool.query('SELECT credential_id, transports FROM authenticators WHERE user_id = $1', [userId]);
    return result.rows;
  }

  static async save({ credentialId, publicKey, counter, transports, userId }) {
    const query = `
      INSERT INTO authenticators (credential_id, credential_public_key, counter, transports, user_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (credential_id) DO UPDATE SET credential_public_key = $2, counter = $3
    `;
    await pool.query(query, [credentialId, publicKey, counter, transports, userId]);
  }

  static async updateCounter(credentialId, newCounter) {
    await pool.query('UPDATE authenticators SET counter = $1 WHERE credential_id = $2', [newCounter, credentialId]);
  }

  static async deleteAllForUser(userId) {
    await pool.query('DELETE FROM authenticators WHERE user_id = $1', [userId]);
  }
}

module.exports = Authenticator;