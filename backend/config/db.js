const { Pool } = require('pg');
require('dotenv').config();

// Create a new pool using the connection string from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;