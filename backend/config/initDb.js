const bcrypt = require('bcryptjs');
const pool = require('./db');

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

    const adminEmail = 'admin@lab.com';
    const adminPass = 'lab123';
    const hashedPassword = await bcrypt.hash(adminPass, 10);

    const query = `
      INSERT INTO users (name, email, password, is_admin)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING;
    `;

    await pool.query(query, ['Admin Lab', adminEmail, hashedPassword, true]);
    
    console.log('\x1b[32m%s\x1b[0m', ' [+] SYSTEM: Admin checkpoint verified.');
    console.log('\x1b[33m%s\x1b[0m', ` [+] ACCESS: ${adminEmail} / ${adminPass}`);
    console.log('\x1b[0m', '-------------------------------------------------');

  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', ' [!] ERROR: Seed execution failed:', err.message);
  }
};

module.exports = { createInitialAdmin };