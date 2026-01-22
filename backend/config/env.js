require('dotenv').config();
const { getOrigins } = require('../utils/envParser');

// [DEBUG] Print loaded variables to logs
console.log("------------------------------------------------");
console.log("[DEBUG] ENV LOADED:");
console.log("RP_ID:", process.env.RP_ID);
console.log("ALLOWED_HOSTS (Raw):", process.env.ALLOWED_HOSTS);
console.log("------------------------------------------------");

module.exports = {
  app: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  security: {
    // Dynamic List based on Env
    allowedHosts: [
      'localhost:5000', 
      '127.0.0.1:5000', 
      process.env.RP_ID, 
      ...(process.env.ALLOWED_HOSTS ? process.env.ALLOWED_HOSTS.split(',') : [])
    ].filter(Boolean),
    
    jwtSecret: process.env.JWT_SECRET || 'super_secret_unified_key_2026',
    jwtExpiresIn: '1h',
    rpId: process.env.RP_ID || 'localhost',
    expectedOrigin: getOrigins()
  },

  db: {
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'phishing_lab_db',
    password: process.env.DB_PASSWORD || 'db_password',
    port: process.env.DB_PORT || 5432,
  }
};