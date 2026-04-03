const express = require('express');
const router = express.Router();

module.exports = (paymentController) => {
  router.get('/api/payments/:tripId', paymentController.getPayment);
  return router;
};