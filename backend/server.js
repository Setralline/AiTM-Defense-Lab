const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');

const authRoutes = require('./routes/auth');
const pool = require('./config/db');
const { createInitialAdmin } = require('./config/initDb');

const app = express();

// =========================================================================
// Security Middleware (OWASP)
// =========================================================================

// 1. Secure HTTP Headers - Protects against well-known web vulnerabilities
app.use(helmet());

// 2. Cross-Origin Resource Sharing (CORS) Configuration
// Now relies on the unified 'config.app.origin' from env.js
const whitelist = config.app.env === 'production'
  ? [config.app.origin]
  : [
    'http://localhost:5173',      // Vite Dev
    'http://127.0.0.1:5173',      // IP Dev
    config.app.origin             // Docker/Custom Origin
  ];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman/Mobile apps) or if in whitelist
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`[Security] Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Critical: Allows exchanging HttpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));

// 3. Body Parsers & Cookie Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 4. Global Rate Limiter - Prevents Brute Force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// =========================================================================
// Routes
// =========================================================================

app.use('/auth', authRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => res.status(200).send('OK'));

// =========================================================================
// Server Initialization
// =========================================================================

const startServer = async () => {
  try {
    // 1. Test Database Connection
    const dbRes = await pool.query('SELECT NOW()');
    console.log('\x1b[32m%s\x1b[0m', ` [OK] Database Connected: ${dbRes.rows[0].now}`);

    // 2. Initialize Database (Admin Account & Tables)
    await createInitialAdmin();

    // 3. Start Listening
    app.listen(config.app.port, () => {
      console.log('\x1b[36m%s\x1b[0m', `-----------------------------------------------`);
      console.log('\x1b[32m%s\x1b[0m', ` [OK] Server running in ${config.app.env} mode`);
      console.log('\x1b[36m%s\x1b[0m', ` [>>] Listening on Port: ${config.app.port}`);
      console.log('\x1b[36m%s\x1b[0m', `-----------------------------------------------`);
    });

  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', ` [!] CRITICAL: Server startup failed: ${err.message}`);
    process.exit(1);
  }
};

// Only start the server if this file is run directly (not during tests)
if (require.main === module) {
  startServer();
}

// Export app for integration testing (Supertest)
module.exports = app;