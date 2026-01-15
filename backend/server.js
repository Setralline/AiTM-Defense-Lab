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

// 1. Secure HTTP Headers
app.use(helmet());

// 2. Cross-Origin Resource Sharing (CORS) Configuration
const whitelist = process.env.NODE_ENV === 'production' 
  ? ['https://your-production-domain.com'] 
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE']
};

app.use(cors(corsOptions));

// 3. Body Parsers
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());

// 4. Global Rate Limiter
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
    const res = await pool.query('SELECT NOW()');
    console.log(`Database Connected: ${res.rows[0].now}`);

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

startServer();