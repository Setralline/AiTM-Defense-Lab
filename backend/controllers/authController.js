const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

/**
 * Admin Login: Database Driven
 * Authenticates users who have the 'is_admin' flag set to true in PostgreSQL.
 */
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Look for the user and verify they have administrative privileges
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_admin = TRUE', 
      [email.toLowerCase().trim()]
    );
    
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Access denied: Admin privileges required' });
    }

    // Verify password against stored hash
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials' });
    }

    // For lab simplicity, we return success. In production, issue a specific JWT here.
    res.json({ 
      success: true, 
      message: 'Administrative session initialized',
      user: { id: admin.id, name: admin.name, email: admin.email }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during administrative login' });
  }
};

/**
 * Validates any operative session (Level 1 or Level 2)
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      'SELECT id, name, email, mfa_secret, is_admin FROM users WHERE id = $1', 
      [decoded.id]
    );
    
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Account no longer exists' });
    }

    res.json({ success: true, user });

  } catch (err) {
    res.status(401).json({ message: 'Session has expired or is invalid' });
  }
};

/**
 * Admin: Retrieve all registered operatives
 */
exports.listUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, mfa_secret, is_admin FROM users ORDER BY id DESC'
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'System error: Unable to fetch operative list' });
  }
};

/**
 * Admin: Provision a new account (Operative or Admin)
 * Now supports the 'isAdmin' flag to grant privileges via code.
 */
exports.createUser = async (req, res) => {
  const { name, email, password, isAdmin } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Provisioning failed: Missing fields' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, name, email, is_admin',
      [name, email.toLowerCase().trim(), hashedPassword, isAdmin || false]
    );

    res.status(201).json({ 
      success: true, 
      message: isAdmin ? 'Administrator created' : 'Operative created',
      user: result.rows[0] 
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Conflict: Email already registered' });
    }
    res.status(500).json({ message: 'Database failure during account creation' });
  }
};

/**
 * Admin: Permanent removal of a user account
 */
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Target not found' });
    }

    res.json({ success: true, message: 'Access terminated and account purged' });
  } catch (err) {
    res.status(500).json({ message: 'System error: Termination failed' });
  }
};