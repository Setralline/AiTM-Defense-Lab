const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// ✅ FIX: Ensure consistency with fidoController secret
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

/**
 * Admin Login: Database Driven
 */
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_admin = TRUE', 
      [email.toLowerCase().trim()]
    );
    
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Access denied: Admin privileges required' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials' });
    }

    // Generate Token for Admin
    const token = jwt.sign({ id: admin.id, isAdmin: true }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ 
      success: true, 
      message: 'Administrative session initialized',
      token, // Return token for persistence
      user: { id: admin.id, name: admin.name, email: admin.email }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during administrative login' });
  }
};

/**
 * Validates any operative session
 * ✅ FIX: Uses the unified JWT_SECRET to validate tokens from FIDO/Level2
 */
exports.getCurrentUser = async (req, res) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    else if (req.cookies?.session_id) {
      token = req.cookies.session_id;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify using the unified secret
    const decoded = jwt.verify(token, JWT_SECRET);

    // Support both 'id' (legacy) and 'userId' (FIDO) payload keys
    const targetId = decoded.id || decoded.userId;

    const result = await pool.query(
      'SELECT id, name, email, mfa_secret, has_fido, is_admin FROM users WHERE id = $1', 
      [targetId]
    );
    
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Account no longer exists' });
    }

    res.json({ success: true, user });

  } catch (err) {
    // This implies the token signature didn't match our secret
    res.status(401).json({ message: 'Session has expired or is invalid' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, mfa_secret, has_fido, is_admin FROM users ORDER BY id DESC'
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'System error' });
  }
};

exports.createUser = async (req, res) => {
  const { name, email, password, isAdmin } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, name, email, is_admin',
      [name, email.toLowerCase().trim(), hashedPassword, isAdmin || false]
    );

    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Database failure' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};