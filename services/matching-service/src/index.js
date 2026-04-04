require('dotenv').config();
require('newrelic');
const express = require('express');


const DriverClient = require('./clients/driverClient');
const RideClient = require('./clients/rideClient');
const TripClient = require('./clients/tripClient');
const MatchingService = require('./services/matchingService');
const MatchingController = require('./controllers/matchingController');
const matchRoutes = require('./routes/matchingRoutes');
const RedisBroker = require('./brokers/redisBroker');


const app = express();
app.use(express.json());

const driverClient = new DriverClient();
const rideClient = new RideClient();
const tripClient = new TripClient();
const broker = new RedisBroker();

const matchingService = new MatchingService(driverClient, rideClient, tripClient, broker);
const controller = new MatchingController(matchingService);

app.use('/api', matchRoutes(controller));
app.get('/health', (req, res) => {
  res.send('Matching Service is running');
});

app.listen(3003, () => {
  console.log('Matching Service running on port 3003');
});