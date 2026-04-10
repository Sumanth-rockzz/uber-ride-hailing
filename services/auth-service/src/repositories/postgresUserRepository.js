const db = require('../config/db');

class PostgresUserRepository {
  async createUser({ name, email, password, role }) {
    const query = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const values = [name, email, password, role];
    const res = await db.query(query, values);
    return res.rows[0];
  }

  async getUserByEmail(email) {
    const res = await db.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return res.rows[0];
  }
}

module.exports = PostgresUserRepository;