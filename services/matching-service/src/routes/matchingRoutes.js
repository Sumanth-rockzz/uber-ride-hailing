// src/routes/matchingRoutes.js
const express = require('express');
const router = express.Router();

module.exports = (controller) => {
  router.post('/match', controller.match);
  router.post('/match/accept', controller.accept);
  return router;
};