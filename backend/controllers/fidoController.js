/**
 * FIDO2 / WEBAUTHN CONTROLLER (Fixed Session Persistence)
 */
const { 
  generateRegistrationOptions, 
  verifyRegistrationResponse, 
  generateAuthenticationOptions, 
  verifyAuthenticationResponse 
} = require('@simplewebauthn/server');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const RP_ID = 'localhost'; 
const EXPECTED_ORIGIN = 'http://localhost:5173'; 
// ✅ Unified Secret
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

let isoBase64URL;
try {
  isoBase64URL = require('@simplewebauthn/server/helpers').isoBase64URL;
} catch (e) {
  isoBase64URL = require('@simplewebauthn/server').isoBase64URL;
}

const fidoController = {

  // PHASE 1: PASSWORD AUTH
  loginWithPassword: async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      if (!user) {
        // Auto-create for lab convenience
        const hashed = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
          "INSERT INTO users (name, email, password) VALUES ('Operative', $1, $2) RETURNING *",
          [email, hashed]
        );
        // Create initial token for the new user
        const token = jwt.sign({ userId: newUser.rows[0].id, email }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ status: 'success', token, user: newUser.rows[0] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid Credentials' });

      if (user.has_fido) {
        return res.json({ status: 'fido_required', email: user.email });
      }

      // Standard Login Token
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ status: 'success', token, user });
    } catch (err) { res.status(500).json({ message: 'Server Error' }); }
  },

  // PHASE 2: REGISTRATION
  registerStart: async (req, res) => {
    const { email } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      const options = await generateRegistrationOptions({
        rpName: 'Cyber Lab Terminal',
        rpID: RP_ID,
        userID: isoBase64URL.toBuffer(user.email),
        userName: user.email,
        attestationType: 'none',
        authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
      });

      await pool.query('UPDATE users SET current_challenge = $1 WHERE id = $2', [options.challenge, user.id]);
      res.json(options);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  registerFinish: async (req, res) => {
    const { email, data } = req.body;
    try {
        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userRes.rows[0];

        const verification = await verifyRegistrationResponse({
            response: data,
            expectedChallenge: user.current_challenge,
            expectedOrigin: EXPECTED_ORIGIN,
            expectedRPID: RP_ID,
        });

        if (verification.verified) {
            const { registrationInfo } = verification;
            const { credential } = registrationInfo;
            const b64PublicKey = isoBase64URL.fromBuffer(credential.publicKey);
            
            await pool.query(
                `INSERT INTO authenticators (credential_id, credential_public_key, counter, transports, user_id)
                 VALUES ($1, $2, $3, $4, $5) ON CONFLICT (credential_id) DO UPDATE SET credential_public_key = $2`,
                [credential.id, b64PublicKey, credential.counter, credential.transports?.join(','), user.id]
            );

            await pool.query('UPDATE users SET has_fido = TRUE, current_challenge = NULL WHERE id = $1', [user.id]);
            
            // ✅ FIX: Generate and return JWT so the user remains logged in after reload
            const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
            
            res.json({ verified: true, token, user });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  },

  // PHASE 3: AUTHENTICATION
  loginStart: async (req, res) => {
    const { email } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      const keysRes = await pool.query('SELECT credential_id, transports FROM authenticators WHERE user_id = $1', [user.id]);
      
      const allowCredentials = keysRes.rows.map(row => ({
        id: row.credential_id,
        type: 'public-key',
        transports: row.transports ? row.transports.split(',') : ['usb'],
      }));

      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials,
        userVerification: 'preferred',
      });

      await pool.query('UPDATE users SET current_challenge = $1 WHERE id = $2', [options.challenge, user.id]);
      res.json(options);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  loginFinish: async (req, res) => {
    const { email, data } = req.body;
    try {
        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userRes.rows[0];

        const keyRes = await pool.query('SELECT * FROM authenticators WHERE credential_id = $1', [data.id]);
        const passkey = keyRes.rows[0];

        if (!passkey) return res.status(400).json({ error: 'Key not found' });

        let publicKeyBuffer;
        try {
            publicKeyBuffer = isoBase64URL.toBuffer(passkey.credential_public_key);
        } catch (e) {
            publicKeyBuffer = Buffer.from(passkey.credential_public_key, 'base64');
        }

        const verification = await verifyAuthenticationResponse({
            response: data,
            expectedChallenge: user.current_challenge,
            expectedOrigin: EXPECTED_ORIGIN,
            expectedRPID: RP_ID,
            credential: {
                id: passkey.credential_id,
                publicKey: new Uint8Array(publicKeyBuffer),
                counter: parseInt(passkey.counter) || 0,
            },
        });

        if (verification.verified) {
            await pool.query('UPDATE authenticators SET counter = $1 WHERE credential_id = $2', 
                [verification.authenticationInfo.newCounter, passkey.credential_id]);
            
            // Generate Token
            const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ verified: true, token, user });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
  },

  disableKey: async (req, res) => {
    const { email } = req.body;
    try {
      const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      const user = userRes.rows[0];
      await pool.query('DELETE FROM authenticators WHERE user_id = $1', [user.id]);
      await pool.query('UPDATE users SET has_fido = FALSE WHERE id = $1', [user.id]);
      res.json({ message: 'Key Removed' });
    } catch (err) { res.status(500).json({ error: 'Revoke failed' }); }
  }
};

module.exports = fidoController;