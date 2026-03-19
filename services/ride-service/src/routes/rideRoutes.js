const express = require('express');
const router = express.Router();

module.exports = (rideController) => {
  router.post('/rides', rideController.createRide);
  return router;
};