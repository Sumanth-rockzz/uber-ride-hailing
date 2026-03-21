// src/config/kafka.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'uber-app',
  brokers: ['localhost:9092'],
});

module.exports = kafka;