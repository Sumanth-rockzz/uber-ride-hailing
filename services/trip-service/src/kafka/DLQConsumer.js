// kafka/dlqConsumer.js

const kafka = require('../config/kafka');

const consumer = kafka.consumer({ groupId: 'dlq-group' });

const startDLQConsumer = async () => {

  await consumer.connect();
  await consumer.subscribe({ topic: 'ride.matched.DLQ' });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());

      console.log("🚨 DLQ EVENT:", data);

      // future:
      // - alert system
      // - manual retry
      // - monitoring dashboard
    }
  });
};

module.exports = startDLQConsumer;