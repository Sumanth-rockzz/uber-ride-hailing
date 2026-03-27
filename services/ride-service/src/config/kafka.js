// src/config/kafka.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'uber-app',
  brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),

  connectionTimeout: 10000, // 10s
  requestTimeout: 30000,    // 30s

  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
});

module.exports = kafka;