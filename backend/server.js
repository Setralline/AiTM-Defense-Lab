const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

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
// UPDATED: Now supports Docker environment variables via CORS_ORIGIN
const whitelist = process.env.NODE_ENV === 'production' 
  ? ['https://your-production-domain.com', process.env.CORS_ORIGIN] 
  : [
      'http://localhost:5173',      // Local Vite Dev
      'http://127.0.0.1:5173',      // Local IP Dev
      process.env.CORS_ORIGIN || 'http://localhost' // Docker / Nginx on Port 80
    ];

const corsOptions = {
  origin: function (origin, callback) {
    // !origin allows server-to-server requests (like Postman or internal scripts)
    // We check if the incoming origin exists in our whitelist array
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin); // Optional: Log blocked requests
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // CRITICAL: Required to allow browser to send/receive HttpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE']
};

app.use(cors(corsOptions));

// 3. Body Parsers & Cookie Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10kb' }));        
app.use(cookieParser()); // Enables reading and clearing HttpOnly cookies

// 4. Global Rate Limiter - Prevents Brute Force attacks on the lab
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// =========================================================================
// Routes
// =========================================================================
app.use('/auth', authRoutes);

// Health Check
app.get('/health', (req, res) => res.status(200).send('OK'));

// =========================================================================
// Server Initialization & Database Connection
// =========================================================================

const startServer = async () => {
  try {
    // 1. Test Database Connection
    const dbRes = await pool.query('SELECT NOW()');
    console.log(`Database Connected: ${dbRes.rows[0].now}`);

    // 2. Initialize the database with the default admin (Lab persistence)
    await createInitialAdmin();

    // 3. Start Listening
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`-----------------------------------------------`);
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`Port: ${PORT}`);
      console.log(`-----------------------------------------------`);
    });

  } catch (err) {
    console.error('CRITICAL: Server startup failed:', err.message);
    process.exit(1);
  }
};

// CRITICAL FIX FOR TESTING:
// Only start the server if this file is run directly (node server.js).
// If imported by Jest/Supertest, do NOT start listening automatically.
if (require.main === module) {
  startServer();
}

// Export app for testing
module.exports = app;