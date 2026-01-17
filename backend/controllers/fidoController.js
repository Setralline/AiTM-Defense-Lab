const { 
  generateRegistrationOptions, 
  verifyRegistrationResponse, 
  generateAuthenticationOptions, 
  verifyAuthenticationResponse 
} = require('@simplewebauthn/server');
const fs = require('fs');
const path = require('path');

const logToReport = (message) => {
    const logPath = path.join(__dirname, '../reportfid.txt');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    console.log(message);
};

let isoBase64URL;
try {
  isoBase64URL = require('@simplewebauthn/server/helpers').isoBase64URL;
} catch (e) {
  isoBase64URL = require('@simplewebauthn/server').isoBase64URL;
}

const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const RP_ID = 'localhost'; 
const EXPECTED_ORIGIN = 'http://localhost:5173'; 
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const fidoController = {
  // 1. LOGIN STEP 1: PASSWORD (كما هي)
  loginWithPassword: async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (!user) {
        const hashed = await bcrypt.hash(password, 10);
        const newUser = await pool.query("INSERT INTO users (name, email, password) VALUES ('Operative', $1, $2) RETURNING *", [email, hashed]);
        return res.json({ status: 'success', user: newUser.rows[0] });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid Credentials' });
      if (user.has_fido) return res.json({ status: 'fido_required', email: user.email });
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ status: 'success', token, user });
    } catch (err) { res.status(500).json({ message: 'Server Error' }); }
  },

  // 2. REGISTRATION (SETUP KEY)
  registerStart: async (req, res) => {
    const { email } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      const options = await generateRegistrationOptions({
        rpName: 'Cyber Lab',
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
        const { credentialID, credentialPublicKey, counter } = registrationInfo;
        
        // استخدام المعرف القادم من المتصفح مباشرة لضمان الدقة
        const b64CredentialID = data.id; 
        const b64PublicKey = isoBase64URL.fromBuffer(credentialPublicKey);
        
        await pool.query(
          `INSERT INTO authenticators (credential_id, credential_public_key, counter, transports)
           VALUES ($1, $2, $3, $4) ON CONFLICT (credential_id) DO UPDATE SET counter = $3`,
          [b64CredentialID, b64PublicKey, counter, data.response.transports ? data.response.transports.join(',') : 'usb']
        );

        // ربط المستخدم بالمفتاح وتحديث الحالة
        await pool.query('UPDATE authenticators SET user_id = $1 WHERE credential_id = $2', [user.id, b64CredentialID]);
        await pool.query('UPDATE users SET has_fido = TRUE, current_challenge = NULL WHERE id = $1', [user.id]);
        
        logToReport(`[REG-SUCCESS] Key registered for ${email}`);
        res.json({ verified: true });
      } else { res.status(400).json({ verified: false }); }
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  // 3. AUTHENTICATION (LOGIN WITH KEY)
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
        logToReport(`[AUTH-FINISH] Verification started for: ${email}`);
        
        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userRes.rows[0];

        // 1. جلب بيانات المفتاح من قاعدة البيانات
        const keyRes = await pool.query('SELECT * FROM authenticators WHERE credential_id = $1', [data.id]);
        const passkey = keyRes.rows[0];

        if (!passkey) {
            logToReport(`[AUTH-FAIL] Passkey not found in DB`);
            return res.status(400).json({ error: 'Could not find passkey' });
        }

        // ✅ الإصلاح الجذري لخطأ No data وفقاً للتوثيق:
        // تحويل المفتاح العام من نص Base64URL إلى Uint8Array
        const publicKeyBuffer = isoBase64URL.toBuffer(passkey.credential_public_key);

        // 2. التحقق من الاستجابة باستخدام هيكلية الإصدار الحديث
        const verification = await verifyAuthenticationResponse({
            response: data,
            expectedChallenge: user.current_challenge,
            expectedOrigin: EXPECTED_ORIGIN,
            expectedRPID: RP_ID,
            credential: {
                id: passkey.credential_id,
                publicKey: publicKeyBuffer, // تمرير الـ Buffer هنا يحل المشكلة
                counter: parseInt(passkey.counter) || 0,
                transports: passkey.transports ? passkey.transports.split(',') : ['usb'],
            },
        });

        if (verification.verified) {
            const { authenticationInfo } = verification;
            const { newCounter } = authenticationInfo;
            
            await pool.query(
                'UPDATE authenticators SET counter = $1 WHERE credential_id = $2',
                [newCounter, passkey.credential_id]
            );
            
            await pool.query('UPDATE users SET current_challenge = NULL WHERE id = $1', [user.id]);
            
            const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
            logToReport(`[AUTH-SUCCESS] User ${email} authenticated.`);
            res.json({ verified: true, token, user });
        } else {
            res.status(400).json({ verified: false });
        }
    } catch (error) {
        logToReport(`[AUTH-FINISH-ERR] Critical: ${error.message}`);
        console.error("Library Error Detail:", error); 
        res.status(400).send({ error: error.message });
    }
},

  disableKey: async (req, res) => {
    const { email } = req.body;
    try {
      const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      const user = userRes.rows[0];
      await pool.query('DELETE FROM authenticators WHERE user_id = $1', [user.id]);
      await pool.query('UPDATE users SET has_fido = FALSE WHERE id = $1', [user.id]);
      res.json({ message: 'FIDO Key Removed Successfully' });
    } catch (err) { res.status(500).json({ error: 'Failed to disable key' }); }
  }
};

module.exports = fidoController;