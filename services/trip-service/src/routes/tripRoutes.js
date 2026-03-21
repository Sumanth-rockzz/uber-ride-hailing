const express = require('express');
const router = express.Router();

module.exports = (tripController) => {
  router.post('/api/trips', tripController.createTrip);
  
  return router;
};