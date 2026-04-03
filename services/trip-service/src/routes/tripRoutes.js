const express = require('express');
const router = express.Router();

module.exports = (tripController) => {
  router.post('/trips', tripController.createTrip);
  router.get('/trips/:tripId', tripController.getTripById);
  router.post('/trips/:tripId/complete', tripController.completeTrip);
  
  return router;
};