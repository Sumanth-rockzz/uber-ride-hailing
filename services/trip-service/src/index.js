// src/index.js
const express = require('express');
require('dotenv').config();

const PostgresTripRepository = require('./repositories/postgresTripRepository');
const TripService = require('./services/tripService.js');
const TripController = require('./controllers/tripController.js');
const tripRoutes = require('./routes/tripRoutes.js');
const RedisBroker = require('./brokers/redisBroker');
const TripConsumer = require('./consumers/tripConsumer');


const app = express();
app.use(express.json());

// Dependency Injection
const tripRepo = new PostgresTripRepository();
const broker = new RedisBroker();
const tripService = new TripService(tripRepo, broker);
const tripController = new TripController(tripService);
const tripConsumer = new TripConsumer(broker, tripService);

app.use('/api', tripRoutes(tripController));

app.get('/health', (req, res) => {
  res.send('Trip Service is running');
});

// Start consumer
tripConsumer.start();

app.listen(3004, () => {
  console.log('Trip Service running on port 3004');
});