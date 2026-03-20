const express = require('express');
const router = express.Router();

module.exports = (rideController) => {
  router.post('/rides', rideController.createRide);

  router.get('/rides/:id', rideController.getRide);

  router.patch('/rides/:id/status', rideController.updateRideStatus);
  
  return router;
};