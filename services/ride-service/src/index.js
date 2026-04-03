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

require('dotenv').config();
const express = require('express');

const PostgresRideRepository = require('./repositories/postgresRideRepository');
const RideService = require('./services/rideService');
const RideController = require('./controllers/rideController');
const rideRoutes = require('./routes/rideRoutes');
const RedisBroker = require('./brokers/redisBroker');
const RideConsumer = require('./consumers/rideConsumer');
const RideDLQConsumer = require('./consumers/rideDLQConsumers');

const app = express();
app.use(express.json());

// Dependency Injection
const rideRepo = new PostgresRideRepository();
const broker = new RedisBroker();
const rideService = new RideService(rideRepo, broker);
const rideController = new RideController(rideService);
const rideConsumer = new RideConsumer(broker, rideService);
const rideDLQConsumer = new RideDLQConsumer(broker, rideService);

app.use('/api', rideRoutes(rideController));
app.get('/health', (req, res) => {
  res.send('Ride Service Running');
});

// Start consumer
rideConsumer.start();
rideDLQConsumer.start();

app.listen(3001, () => {
  console.log('Ride Service running on port 3001');
});