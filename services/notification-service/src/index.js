require('dotenv').config();
require('newrelic');

const express = require('express');
const RedisBroker = require('./brokers/RedisBroker');
const NotificationService = require('./services/notificationService');
const NotificationConsumer = require('./consumers/notificationConsumer');

const app = express();
app.use(express.json());

// Dependency Injection
const broker = new RedisBroker();
const notificationService = new NotificationService();
const consumer = new NotificationConsumer(broker, notificationService);

// Health check 
app.get('/health', (req, res) => {
  res.send('Notification Service is running');
});

// Start consumer
consumer.start();

// start server
const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
  console.log(`🚀 Notification Service running on port ${PORT}`);
});