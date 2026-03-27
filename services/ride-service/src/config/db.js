const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'admin',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_DATABASE || 'uber',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5433,
});

module.exports = pool;