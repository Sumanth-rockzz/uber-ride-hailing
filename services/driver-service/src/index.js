// src/index.js
require('dotenv').config();
require('newrelic');
const express = require('express');

const RedisDriverRepository = require('./repositories/redisDriverRepository');
const DriverService = require('./services/driverService');
const DriverController = require('./controllers/driverController');
const driverRoutes = require('./routes/driverRoutes');


const app = express();
app.use(express.json());

const driverRepo = new RedisDriverRepository();
const driverService = new DriverService(driverRepo);
const driverController = new DriverController(driverService);

app.use('/api', driverRoutes(driverController));
app.use('/health', (req, res) => {
  res.send('Driver Service Running');
});

app.listen(process.env.PORT || 3002, () => {
  console.log('Driver Service running on port ' + (process.env.PORT || 3002));
});