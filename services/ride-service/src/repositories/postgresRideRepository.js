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
}

module.exports = PostgresRideRepository;