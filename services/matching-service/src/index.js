const express = require('express');

const DriverClient = require('./clients/driverClient');
const RideClient = require('./clients/rideClient');
const TripClient = require('./clients/tripClient');
const MatchingService = require('./services/matchingService');
const MatchingController = require('./controllers/matchingController');
const matchRoutes = require('./routes/matchingRoutes');
//const { connectProducer } = require('./kafka/producer');
require('dotenv').config();

const app = express();
app.use(express.json());

const driverClient = new DriverClient();
const rideClient = new RideClient();
const tripClient = new TripClient();

const matchingService = new MatchingService(driverClient, rideClient, tripClient);
const controller = new MatchingController(matchingService);



// (async () => {
//   await connectProducer();   // ✅ MUST DO THIS
// })();

app.use('/api', matchRoutes(controller));
app.get('/health', (req, res) => {
  res.send('Matching Service is running');
});

app.listen(3003, () => {
  console.log('Matching Service running on port 3003');
});