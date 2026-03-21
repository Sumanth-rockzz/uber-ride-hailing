const TripRepository = require('./tripRepository');
const pool = require('../config/db');

class PostgresTripRepository extends TripRepository {
async createTrip({ rideId, driverId }) {
  const result = await pool.query(
    `INSERT INTO trips (ride_id, driver_id, status)
      VALUES ($1, $2, $3)
      RETURNING *`,
    [rideId, driverId, 'STARTED']
  );

  return result.rows[0];
}
}

module.exports = PostgresTripRepository;