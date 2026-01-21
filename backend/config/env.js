require('dotenv').config();

module.exports = {
  app: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  security: {
    allowedHosts: ['thesis-osamah-lab.live', 'localhost:5000', '127.0.0.1:5000'],
    jwtSecret: process.env.JWT_SECRET || 'super_secret_unified_key_2026',
    jwtExpiresIn: '1h',
    rpId: 'localhost',
    expectedOrigin: ['http://localhost:5173', 'http://localhost']
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