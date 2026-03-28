// // ride-service/src/kafka/consumer.js
// const kafka = require('../config/kafka');
// const pool = require('../config/db');

// const consumer = kafka.consumer({ groupId: 'ride-group' });

// const startConsumer = async (rideService) => {
//   try {
//     await consumer.connect();
//     console.log("Kafka connected ✅");
//   } catch (err) {
//     console.error("Kafka connection failed ❌", err.message);
//   }
//   await consumer.subscribe({ topic: 'ride.matched' });

//   await consumer.run({
//     eachMessage: async ({ message }) => {
//       const data = JSON.parse(message.value.toString());

//        console.log("ride service kafka message received", data);

//       rideService.updateRideStatus(data.rideId, 'MATCHED');

//       console.log('Ride updated via Kafka');
//     }
//   });
// };

// module.exports = startConsumer;

const sub = require('../config/redisSubscriber');

const startConsumer = async (rideService) => {
  await sub.subscribe("ride.matched");

  console.log("👂 ride-service listening to ride.matched");

  sub.on("message", async (channel, message) => {
    if (channel !== "ride.matched") return;

    const data = JSON.parse(message);

    console.log("ride service message received", data);

    try {
      await rideService.updateRideStatus(data.rideId, "MATCHED");
      console.log("Ride updated via Redis ✅");
    } catch (err) {
      console.error("Ride update failed ❌", err.message);

      // DLQ fallback
      await sub.publish("ride.matched.DLQ", message);
    }
  });
};

module.exports = startConsumer;
