// src/index.js
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'postgres',
  password: 'admin',
  port: 5433,
});

app.post('/api/trips', async (req, res) => {
  const { rideId, driverId } = req.body;

  const result = await pool.query(
    `INSERT INTO trips (ride_id, driver_id, status)
     VALUES ($1, $2, $3) RETURNING *`,
    [rideId, driverId, 'STARTED']
  );

  res.json(result.rows[0]);
});

app.listen(3004, () => {
  console.log('Trip Service running on port 3004');
});