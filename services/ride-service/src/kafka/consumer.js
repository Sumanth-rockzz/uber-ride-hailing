// ride-service/src/kafka/consumer.js
const kafka = require('../config/kafka');
const pool = require('../config/db');

const consumer = kafka.consumer({ groupId: 'ride-group' });

const startConsumer = async (rideService) => {
  try {
    await consumer.connect();
    console.log("Kafka connected ✅");
  } catch (err) {
    console.error("Kafka connection failed ❌", err.message);
  }
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