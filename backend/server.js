const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/env'); // ✅ استخدام الإعدادات المركزية

const authRoutes = require('./routes/auth');
const pool = require('./config/db');
const { createInitialAdmin } = require('./config/initDb'); 

const app = express();

// =========================================================================
// Security Middleware (OWASP)
// =========================================================================

// 1. Secure HTTP Headers
app.use(helmet());

// 2. CORS Configuration
// يعتمد الآن على config.app.origin الموحد في env.js
const whitelist = config.app.env === 'production' 
  ? [config.app.origin] 
  : [
      'http://localhost:5173',      // Vite Dev
      'http://127.0.0.1:5173',      // IP Dev
      config.app.origin             // Docker/Custom Origin
    ];

const corsOptions = {
  origin: function (origin, callback) {
    // السماح بالطلبات بدون origin (مثل Postman) أو إذا كان ضمن القائمة البيضاء
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`[Security] Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // ضروري لتبادل الكوكيز (HttpOnly)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));

// 3. Body Parsers & Cookie Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10kb' }));        
app.use(cookieParser());

// 4. Rate Limiter (Brute Force Protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // 100 طلب لكل IP
  message: { message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// =========================================================================
// Routes
// =========================================================================
app.use('/auth', authRoutes);

// Health Check
app.get('/health', (req, res) => res.status(200).send('OK'));

// =========================================================================
// Server Initialization
// =========================================================================

const startServer = async () => {
  try {
    // 1. Test Database Connection
    const dbRes = await pool.query('SELECT NOW()');
    console.log(`✅ Database Connected: ${dbRes.rows[0].now}`);

    // 2. Initialize Database (Admin & Tables)
    await createInitialAdmin();

    // 3. Start Listening
    app.listen(config.app.port, () => {
      console.log(`-----------------------------------------------`);
      console.log(`🚀 Server running in ${config.app.env} mode`);
      console.log(`🔗 Listening on Port: ${config.app.port}`);
      console.log(`-----------------------------------------------`);
    });

  } catch (err) {
    console.error('❌ CRITICAL: Server startup failed:', err.message);
    process.exit(1);
  }
};

// تشغيل السيرفر فقط إذا تم استدعاء الملف مباشرة (وليس أثناء الاختبارات)
if (require.main === module) {
  startServer();
}

module.exports = app;