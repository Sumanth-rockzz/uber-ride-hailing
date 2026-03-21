// ride-service/src/kafka/consumer.js
const kafka = require('../config/kafka');
const pool = require('../config/db');

const consumer = kafka.consumer({ groupId: 'ride-group' });

const startConsumer = async (rideService) => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'ride.matched' });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());

       console.log("ride service kafka message received", data);

      rideService.updateRideStatus(data.rideId, 'MATCHED');

      console.log('Ride updated via Kafka');
    }
  });
};

module.exports = startConsumer;