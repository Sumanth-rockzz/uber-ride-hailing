const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleWare');
const rateLimiter = require('../middleware/rateLimiter');

module.exports = (rideController) => {
  router.post('/rides', authMiddleware, rateLimiter({ limit: 5, windowSec: 60 }), rideController.createRide);

  router.get('/rides/:id', rideController.getRide);

  router.patch('/rides/:id/status', rideController.updateRideStatus);
  
  return router;
};