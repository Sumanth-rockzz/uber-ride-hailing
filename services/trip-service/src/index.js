// src/index.js
const express = require('express');

const PostgresTripRepository = require('./repositories/postgresTripRepository');
const TripService = require('./services/tripService.js');
const TripController = require('./controllers/tripController.js');
const tripRoutes = require('./routes/tripRoutes.js');
require('dotenv').config();

const app = express();
app.use(express.json());

// Dependency Injection
const tripRepo = new PostgresTripRepository();
const tripService = new TripService(tripRepo);
const tripController = new TripController(tripService);
const startConsumer = require('./kafka/consumer.js');
const startDLQConsumer = require('./kafka/DLQConsumer.js');

app.use('/api', tripRoutes(tripController));

app.get('/health', (req, res) => {
  res.send('Trip Service is running');
});

// Start Kafka consumer
startConsumer(tripService);

// Start DLQ consumer
startDLQConsumer(); 


app.listen(3004, () => {
  console.log('Trip Service running on port 3004');
});