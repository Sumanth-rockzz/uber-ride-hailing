// trip-service/src/kafka/consumer.js
const kafka = require('../config/kafka');

const consumer = kafka.consumer({ groupId: 'trip-group' });

const startConsumer = async (tripService) => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'ride.matched' });

  await consumer.run({
    eachMessage: async ({ message }) => {

      const data = JSON.parse(message.value.toString());
      console.log("trip service kafka message received", data);

      tripService.createTrip(data);

      console.log('Trip created via Kafka');
    }
  });
};

module.exports = startConsumer ;