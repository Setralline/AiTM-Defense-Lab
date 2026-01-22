const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');

const { getSecurityConfig } = require('./utils/helpers');

const authRoutes = require('./routes/auth');
const pool = require('./config/db');
const { createInitialAdmin } = require('./config/initDb');

const app = express();

// Enable trust proxy so rate limiter can see correct client IPs behind Nginx/Evilginx
app.set('trust proxy', 1);

// =========================================================================
// Security Middleware (OWASP)
// =========================================================================

app.use(helmet());

const whitelist = config.app.env === 'production'
  ? [config.app.origin]
  : [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    config.app.origin
  ];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`\x1b[33m%s\x1b[0m`, `[Security] Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// =========================================================================
// Routes
// =========================================================================

app.use('/auth', authRoutes);

/**
 * [LABS DEFENSE] - Dynamic Security Configuration Endpoint
 * This endpoint allows the frontend DomainGuard to verify the 
 * legitimate domain dynamically based on Docker environment variables.
 * NOW USES HELPER FUNCTION TO PREVENT SPOOFING.
 */
app.get('/api/config/security', (req, res) => {
    // 1. Force No-Cache (Critical for Security Configs)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    // 2. Get Truth
    const securityConfig = getSecurityConfig();
    
    // Debug Log
    console.log(`[Security Config] Serving Truth: ${securityConfig.allowedDomain} | Requester IP: ${req.ip}`);

    res.json(securityConfig);
});

// Health Check Endpoint
app.get('/health', (req, res) => res.status(200).send('OK'));

// =========================================================================
// Server Initialization
// =========================================================================

const startServer = async () => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    console.log('\x1b[32m%s\x1b[0m', ` [OK] Database Connected: ${dbRes.rows[0].now}`);

    await createInitialAdmin();

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

if (require.main === module) {
  startServer();
}

module.exports = app;