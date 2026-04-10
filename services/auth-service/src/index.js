require("dotenv").config();
const express = require("express");

const AuthService = require("./services/authService");
const AuthController = require("./controllers/authController");
const authRoutes = require("./routes/authRoutes");
const UserRepo = require("./repositories/postgresUserRepository");

const app = express();
app.use(express.json());

const repo = new UserRepo();
const service = new AuthService(repo);
const controller = new AuthController(service);

app.use(authRoutes(controller));

app.listen(process.env.AUTH_SERVICE_PORT || 3007, () => {
  console.log("Auth Service running on " + (process.env.AUTH_SERVICE_PORT || 3007));
});