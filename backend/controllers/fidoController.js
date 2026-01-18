const { 
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse 
} = require('@simplewebauthn/server');
const { isoBase64URL } = require('@simplewebauthn/server/helpers');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../config/env');
const User = require('../models/User');
const Authenticator = require('../models/Authenticator');

const fidoController = {
  // 1. Password Handshake
  loginWithPassword: async (req, res) => {
    const { email, password } = req.body;
    try {
      let user = await User.findByEmail(email);
      // Auto-register for lab convenience
      if (!user) {
        const hashed = await bcrypt.hash(password, 10);
        user = await User.create({ name: 'Operative', email, password: hashed });
        const token = jwt.sign({ id: user.id, email }, config.security.jwtSecret, { expiresIn: '1h' });
        return res.json({ status: 'success', token, user });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      if (user.has_fido) {
        return res.json({ status: 'fido_required', email: user.email });
      }

      const token = jwt.sign({ id: user.id, email }, config.security.jwtSecret, { expiresIn: '1h' });
      res.json({ status: 'success', token, user });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
  },

  // 2. Registration
  registerStart: async (req, res) => {
    try {
      const user = await User.findByEmail(req.body.email);
      const options = await generateRegistrationOptions({
        rpName: 'Cyber Lab',
        rpID: config.security.rpId,
        userID: isoBase64URL.toBuffer(user.email),
        userName: user.email,
        attestationType: 'none',
      });
      await User.updateChallenge(user.id, options.challenge);
      res.json(options);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  registerFinish: async (req, res) => {
    const { email, data } = req.body;
    try {
      const user = await User.findByEmail(email);
      const verification = await verifyRegistrationResponse({
        response: data,
        expectedChallenge: user.current_challenge,
        expectedOrigin: config.security.expectedOrigin,
        expectedRPID: config.security.rpId,
      });

      if (verification.verified) {
        const { credential } = verification.registrationInfo;
        await Authenticator.save({
          credentialId: credential.id,
          publicKey: isoBase64URL.fromBuffer(credential.publicKey),
          counter: credential.counter,
          transports: credential.transports?.join(','),
          userId: user.id
        });
        await User.enableFido(user.id);
        
        // Return token so user stays logged in
        const token = jwt.sign({ id: user.id, email }, config.security.jwtSecret, { expiresIn: '1h' });
        res.json({ verified: true, token, user });
      }
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  // 3. Authentication
  loginStart: async (req, res) => {
    try {
      const user = await User.findByEmail(req.body.email);
      const auths = await Authenticator.getUserAuthenticators(user.id);
      const options = await generateAuthenticationOptions({
        rpID: config.security.rpId,
        allowCredentials: auths.map(a => ({
          id: a.credential_id,
          type: 'public-key',
          transports: a.transports ? a.transports.split(',') : ['usb'],
        })),
      });
      await User.updateChallenge(user.id, options.challenge);
      res.json(options);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  loginFinish: async (req, res) => {
    const { email, data } = req.body;
    try {
      const user = await User.findByEmail(email);
      const key = await Authenticator.findByCredentialId(data.id);
      if (!key) throw new Error('Key not found');

      let publicKey;
      try { publicKey = isoBase64URL.toBuffer(key.credential_public_key); }
      catch (e) { publicKey = Buffer.from(key.credential_public_key, 'base64'); }

      const verification = await verifyAuthenticationResponse({
        response: data,
        expectedChallenge: user.current_challenge,
        expectedOrigin: config.security.expectedOrigin,
        expectedRPID: config.security.rpId,
        credential: {
          id: key.credential_id,
          publicKey: new Uint8Array(publicKey),
          counter: parseInt(key.counter),
        },
      });

      if (verification.verified) {
        await Authenticator.updateCounter(key.credential_id, verification.authenticationInfo.newCounter);
        const token = jwt.sign({ id: user.id, email }, config.security.jwtSecret, { expiresIn: '1h' });
        res.json({ verified: true, token, user });
      }
    } catch (err) { res.status(400).json({ error: err.message }); }
  },

  disableKey: async (req, res) => {
    try {
      const user = await User.findByEmail(req.body.email);
      await Authenticator.deleteAllForUser(user.id);
      await User.disableFido(user.id);
      res.json({ message: 'Disabled' });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
  }
};

module.exports = fidoController;