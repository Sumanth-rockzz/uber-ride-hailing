// const express = require('express');
// const pool = require('./config/db');

// const app = express();
// app.use(express.json());


// app.get('/health', (req, res) => {
//   res.send('Ride Service Running');
// });

// app.get('/db-test', async (req, res) => {
//   const result = await pool.query('SELECT NOW()');
//   res.json(result.rows);
// });

// app.listen(3001, () => {
//   console.log('Ride Service running on port 3001');
// });

const express = require('express');

const PostgresRideRepository = require('./repositories/postgresRideRepository');
const RideService = require('./services/rideService');
const RideController = require('./controllers/rideController');
const rideRoutes = require('./routes/rideRoutes');

const app = express();
app.use(express.json());

// Dependency Injection
const rideRepo = new PostgresRideRepository();
const rideService = new RideService(rideRepo);
const rideController = new RideController(rideService);

app.use('/api', rideRoutes(rideController));

app.listen(3001, () => {
  console.log('Ride Service running on port 3001');
});