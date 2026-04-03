// repositories/postgresPaymentRepository.js
const db = require('../config/db');

class PostgresPaymentRepository {
  async createPayment({ tripId, rideId, amount, status, paymentId }) {
    const query = `
      INSERT INTO payments (trip_id, ride_id, amount, status, payment_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [tripId, rideId, amount, status, paymentId];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async findByTripId(tripId) {
    const result = await db.query(
      `SELECT * FROM payments WHERE trip_id = $1`,
      [tripId]
    );
    return result.rows[0];
  }
}

module.exports = PostgresPaymentRepository;