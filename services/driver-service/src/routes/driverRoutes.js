const express = require('express');
const router = express.Router();

module.exports = (driverController) => {
  router.post('/drivers/:id/location', driverController.updateLocation);
  router.get('/drivers/nearby', driverController.findNearbyDrivers);
  return router;
};