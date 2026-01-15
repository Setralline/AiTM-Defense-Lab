const bcrypt = require('bcryptjs');
const pool = require('./db');

/**
 * Database Initialization Script
 * Automatically creates necessary tables and provisions the initial admin account.
 */
const createInitialAdmin = async () => {
  try {
    // --- OSAMAH AMER SIGNATURE (TERMINAL) ---
    console.log('\x1b[31m%s\x1b[0m', `
    ██████╗ ███████╗ █████╗ ███╗   ███╗ █████╗ ██╗  ██╗
    ██╔══██╗██╔════╝██╔══██╗████╗ ████║██╔══██╗██║  ██║
    ██║  ██║███████╗███████║██╔████╔██║███████║███████║
    ██║  ██║╚════██║██╔══██║██║╚██╔╝██║██╔══██║██╔══██║
    ██████╔╝███████║██║  ██║██║ ╚═╝ ██║██║  ██║██║  ██║
    ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
    `);
    
    console.log('\x1b[36m%s\x1b[0m', ' > MODERN PHISHING LAB LOADED');
    console.log('\x1b[36m%s\x1b[0m', ' > AUTHOR: OSAMAH AMER');
    console.log('\x1b[36m%s\x1b[0m', ' > YEAR: 2026\n');

    // 1. Create Tables if they do not exist
    const createTablesQuery = `
      -- Users Table for Operatives and Admins
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        mfa_secret TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Blacklist Table to invalidate stolen session cookies
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createTablesQuery);
    console.log('\x1b[32m%s\x1b[0m', ' [+] SYSTEM: Database schema verified/created.');

    // 2. Provision Initial Admin Account
    const adminEmail = 'admin@lab.com';
    const adminPass = 'lab123';
    const hashedPassword = await bcrypt.hash(adminPass, 10);

    const seedAdminQuery = `
      INSERT INTO users (name, email, password, is_admin)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING;
    `;

    await pool.query(seedAdminQuery, ['Admin Lab', adminEmail, hashedPassword, true]);
    
    console.log('\x1b[32m%s\x1b[0m', ' [+] SYSTEM: Admin checkpoint verified.');
    console.log('\x1b[33m%s\x1b[0m', ` [+] ACCESS: ${adminEmail} / ${adminPass}`);
    console.log('\x1b[0m', '-------------------------------------------------');

  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', ' [!] ERROR: Seed execution failed:', err.message);
  }
};

module.exports = { createInitialAdmin };