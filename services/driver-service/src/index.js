// src/index.js
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

app.listen(3002, () => {
  console.log('Driver Service running on port 3002');
});