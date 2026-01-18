const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const User = require('../models/User');

// Helper to standardise token generation
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, userId: user.id, email: user.email, isAdmin: user.is_admin },
    config.security.jwtSecret,
    { expiresIn: config.security.jwtExpiresIn }
  );
};

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Credentials required' });

  try {
    const user = await User.findByEmail(email);
    
    if (!user || !user.is_admin) {
      return res.status(401).json({ message: 'Access Denied: Admin only' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1] || req.cookies?.session_id;

    if (!token) return res.status(401).json({ message: 'No session token' });

    const decoded = jwt.verify(token, config.security.jwtSecret);
    const userId = decoded.id || decoded.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Sanitize
    delete user.password;
    delete user.current_challenge;

    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ message: 'Session expired or invalid' });
  }
};

// ... (CRUD functions follow same pattern using User model)
exports.listUsers = async (req, res) => {
  const pool = require('../config/db'); // Temporary direct access for bulk list
  const result = await pool.query('SELECT id, name, email, has_fido, is_admin FROM users ORDER BY id DESC');
  res.json({ users: result.rows });
};

exports.createUser = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const user = await User.create({ ...req.body, password: hashedPassword });
    res.status(201).json({ success: true, user });
  } catch (err) { res.status(500).json({ message: 'Creation failed' }); }
};

exports.deleteUser = async (req, res) => {
  const pool = require('../config/db');
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ success: true });
};