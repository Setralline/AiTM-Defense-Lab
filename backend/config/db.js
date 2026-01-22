const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool(config.db);

pool.on('connect', () => {
  // Optional: Console log on new connection
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;