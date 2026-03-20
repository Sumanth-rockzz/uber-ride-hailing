const RideRepository = require('./rideRepository');
const pool = require('../config/db');

class PostgresRideRepository extends RideRepository {
async createRide({ riderId, pickup, destination }) {
  const result = await pool.query(
    `INSERT INTO rides (rider_id, pickup, destination, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
    [riderId, pickup, destination, 'REQUESTED']
  );

  return result.rows[0];
}
async getRideById(id) {
  const result = await pool.query(
    `SELECT * FROM rides WHERE id = $1`,
    [id]
  );

  return result.rows[0];
}
async updateRideStatus(id, status) {
  const result = await pool.query(
    `UPDATE rides SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );

  return result.rows[0];
}
}

module.exports = PostgresRideRepository;