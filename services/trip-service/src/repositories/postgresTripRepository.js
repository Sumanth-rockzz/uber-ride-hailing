const TripRepository = require('./tripRepository');
const pool = require('../config/db');

class PostgresTripRepository extends TripRepository {
async createTrip({ rideId, driverId }) {
  const result = await pool.query(
    `INSERT INTO trips (ride_id, driver_id, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (ride_id) DO NOTHING
      RETURNING *`,
    [rideId, driverId, 'STARTED']
  );

    return result.rows[0];
  }
  
  async getTripById(tripId) {
    const result = await pool.query(
      `SELECT * FROM trips WHERE id = $1`,
      [tripId]
    );
    return result.rows[0];
  }
  
  async updateStatus(tripId, status) {
    const result = await pool.query(
      `UPDATE trips SET status = $1 WHERE id = $2 RETURNING *`,
      [status, tripId]
    );
    return result.rows[0];
  }


  }

  module.exports = PostgresTripRepository;