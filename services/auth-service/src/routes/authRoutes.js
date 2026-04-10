const express = require("express");
const router = express.Router();

module.exports = (controller) => {
  router.post("/api/auth/signup", controller.signup);
  router.post("/api/auth/login", controller.login);
  return router;
};