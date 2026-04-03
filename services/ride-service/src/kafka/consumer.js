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

// const redisBroker = require('../brokers/redisBroker');

// const startConsumer = async (rideService) => {
//   await redisBroker.subscribe("ride.matched");
//   await redisBroker.subscribe("payment.completed");
//   await redisBroker.subscribe("payment.failed");

//   console.log("👂 ride-service listening to events");

//   redisBroker.subscriber.on("message", async (channel, message) => {
//     const data = JSON.parse(message);

//     console.log("ride service message received", channel, data);

//     try {
//       // ✅ Ride matched
//       if (channel === "ride.matched") {
//         await rideService.updateRideStatus(data.rideId, "MATCHED");
//         console.log("Ride updated to MATCHED ✅");
//       }

//       // ✅ Payment success
//       else if (channel === "payment.completed") {
//         await rideService.updateRideStatus(data.rideId, "COMPLETED");
//         console.log("Ride updated to COMPLETED 💰✅");
//       }

//       // ❌ Payment failed
//       else if (channel === "payment.failed") {
//         await rideService.updateRideStatus(data.rideId, "PAYMENT_FAILED");
//         console.log("Ride updated to PAYMENT_FAILED ❌");
//       }

//     } catch (err) {
//       console.error("Ride update failed ❌", err.message);

//       // DLQ fallback (same pattern you used)
//       await redisBroker.publish(`${channel}.DLQ`, message);
//     }
//   });
// };

// module.exports = startConsumer;
