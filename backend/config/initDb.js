const bcrypt = require('bcryptjs');
const pool = require('./db');

/**
 * ------------------------------------------------------------------
 * CYBER LAB - DATABASE INITIALIZATION SCRIPT (2026)
 * ------------------------------------------------------------------
 * وظيفة الملف: 
 * 1. مسح الجداول القديمة (Clean Slate Protocol).
 * 2. بناء هيكلية الجداول المتوافقة مع معايير FIDO2 Level 5.
 * 3. إنشاء حساب المسؤول الأول (Initial Admin Provisioning).
 */
const createInitialAdmin = async () => {
  try {
    // --- شعار المختبر (Cyber Lab Branding) ---
    console.log('\x1b[35m%s\x1b[0m', `
    ██████╗██╗   ██╗██████╗ ███████╗██████╗ 
   ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗
   ██║     ╚████╔╝ ██████╔╝█████╗   ██████╔╝
   ██║      ╚██╔╝  ██╔══██╗██╔══╝   ██╔══██╗
   ╚██████╗   ██║   ██████╔╝███████╗██║  ██║
    ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝
    `);
    
    console.log('\x1b[36m%s\x1b[0m', ' > CYBER LAB | CORE INITIALIZATION SEQUENCE');
    console.log('\x1b[36m%s\x1b[0m', ' > SECURITY LEVEL: 5 (FIDO2 + BIOMETRIC)');
    console.log('\x1b[36m%s\x1b[0m', ' > AUTHOR: OSAMAH AMER | YEAR: 2026\n');

    // ==========================================================
    // 0. بروتوكول التصفير (Reset Protocol)
    // ==========================================================
    console.log('\x1b[33m%s\x1b[0m', ' [!] WARNING: Wiping existing laboratory data...');
    
    const dropTablesQuery = `
      DROP TABLE IF EXISTS authenticators CASCADE;
      DROP TABLE IF EXISTS token_blacklist CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `;
    await pool.query(dropTablesQuery);
    
    console.log('\x1b[32m%s\x1b[0m', ' [+] SYSTEM: Database wiped. Clean slate confirmed.');

    // ==========================================================
    // 1. بناء الهيكلية (Schema Generation)
    // ==========================================================
    const createTablesQuery = `
      -- جدول المستخدمين (المشغلين والمسؤولين)
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        current_challenge TEXT,         -- تخزين تحدي FIDO2 المؤقت
        has_fido BOOLEAN DEFAULT FALSE, -- مؤشر تفعيل حماية مفتاح الأمان
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- جدول الموثقين (FIDO2 Authenticators)
      -- ملاحظة: تم جعل credential_id هو المفتاح الأساسي لضمان التفرد
      CREATE TABLE authenticators (
        credential_id TEXT PRIMARY KEY,
        credential_public_key TEXT NOT NULL, -- المفتاح العام المخزن (Base64URL)
        counter BIGINT DEFAULT 0,           -- عداد التواقيع للحماية من الاستنساخ
        transports TEXT,                    -- وسائط الاتصال (usb, nfc, ble, internal)
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- جدول القائمة السوداء للتوكنات (JWT Blacklist)
      CREATE TABLE token_blacklist (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createTablesQuery);
    console.log('\x1b[32m%s\x1b[0m', ' [+] SYSTEM: Cyber Lab schema successfully deployed.');

    // ==========================================================
    // 2. إنشاء حساب المسؤول الأول (Admin Provisioning)
    // ==========================================================
    const adminEmail = 'admin@lab.com';
    const adminPass = 'lab123'; // يرجى تغييره بعد الدخول الأول
    const hashedPassword = await bcrypt.hash(adminPass, 10);

    const seedAdminQuery = `
      INSERT INTO users (name, email, password, is_admin)
      VALUES ($1, $2, $3, $4);
    `;

    await pool.query(seedAdminQuery, ['Cyber Lab Admin', adminEmail, hashedPassword, true]);
    
    console.log('\x1b[32m%s\x1b[0m', ' [+] SYSTEM: Admin credentials provisioned.');
    console.log('\x1b[33m%s\x1b[0m', ` [+] ACCESS GRANTED: ${adminEmail} / ${adminPass}`);
    console.log('\x1b[0m', '-------------------------------------------------');

  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', ' [!] CRITICAL ERROR: Initialization failed:', err.message);
    process.exit(1); // إنهاء العملية في حال فشل التهيئة
  }
};

module.exports = { createInitialAdmin };