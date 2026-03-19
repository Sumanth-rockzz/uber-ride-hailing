const { Pool } = require('pg');

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'uber',
  password: 'admin',
  port: 5433,
});

module.exports = pool;