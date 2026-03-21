// src/index.js
const express = require('express');

const PostgresTripRepository = require('./repositories/postgresTripRepository');
const TripService = require('./services/tripService.js');
const TripController = require('./controllers/tripController.js');
const tripRoutes = require('./routes/tripRoutes.js');

const app = express();
app.use(express.json());

// Dependency Injection
const tripRepo = new PostgresTripRepository();
const tripService = new TripService(tripRepo);
const tripController = new TripController(tripService);
const startConsumer = require('./kafka/consumer.js');

app.use('/api', tripRoutes(tripController));

// Start Kafka consumer
startConsumer(tripService);


app.listen(3004, () => {
  console.log('Trip Service running on port 3004');
});