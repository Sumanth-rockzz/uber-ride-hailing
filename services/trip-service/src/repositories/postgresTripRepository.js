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
  
  async updateTrip(tripId, updates) {
    const result = await pool.query(
      `UPDATE trips SET ${Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(', ')} WHERE id = $${Object.keys(updates).length + 1} RETURNING *`,
      [...Object.values(updates), tripId]
    );
    return result.rows[0];
  }


  }

  module.exports = PostgresTripRepository;