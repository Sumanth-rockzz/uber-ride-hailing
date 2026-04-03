// // // trip-service/src/kafka/consumer.js
// // const kafka = require('../config/kafka');

// // const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// // const consumer = kafka.consumer({ groupId: 'trip-group' });

// // const startConsumer = async (tripService) => {
// //   await consumer.connect();
// //   await consumer.subscribe({ topic: 'ride.matched' });

// //   await consumer.run({
// //     eachMessage: async ({ message }) => {

// //       const data = JSON.parse(message.value.toString());
// //       console.log("trip service kafka message received", data);
// //       try {
// //         await tripService.createTrip(data);
// //         console.log('Trip created via Kafka');
// //       } catch (error) {
// //          if (error.code === '23505') {
// //             console.log("Duplicate trip ignored ✅");
// //             return;
// //         }
// //         console.error('Error creating trip via Kafka:', error);

// //         const retryCount = data.retryCount || 0;

// //         if (retryCount >= 3) {
// //           // 👉 Send to DLQ
// //           await sendEvent('ride.matched.DLQ', data);
// //           console.log("Moved to DLQ 🚨");
// //           return;
// //         } 
// //             // 🔥 Backoff time
// //         const delays = [3000, 5000, 10000];
// //         const delay = delays[retryCount] || 10000;

// //         console.log(`Retrying after ${delay} ms`);

// //         await sleep(delay);
// //         // 👉 Retry by re-publishing
// //         await sendEvent('ride.matched', {
// //         ...data,
// //         retryCount: retryCount + 1
// //         });


// //       }
// //     }
// //   });
// // };

// // module.exports = startConsumer ;

// // For temporary cloud constraints, we are not using kafka for now switched to redis pub/sub  no persistence
// // trip-service/src/redis/consumer.js
// const redisBroker = require('../brokers/redisBroker');


// const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// const startConsumer = async (tripService) => {
//   await redisBroker.subscribe("ride.matched");

//   console.log("👂 trip-service listening to ride.matched");

//   redisBroker.subscriber.on("message", async (channel, message) => {
//     if (channel !== "ride.matched") return;

//     const data = JSON.parse(message);
//     console.log("trip service message received", data);

//     try {
//       await tripService.createTrip(data);
//       console.log("Trip created via Redis ✅");

//     } catch (error) {

//       if (error.code === "23505") {
//         console.log("Duplicate trip ignored ✅");
//         return;
//       }

//       console.error("Error creating trip ❌", error.message);

//       const retryCount = data.retryCount || 0;

//       if (retryCount >= 3) {
//         await redisBroker.publish("ride.matched.DLQ", data);
//         console.log("Moved to DLQ 🚨");
//         return;
//       }

//       const delays = [3000, 5000, 10000];
//       const delay = delays[retryCount] || 10000;

//       console.log(`Retrying after ${delay} ms`);

//       await sleep(delay);

//       await redisBroker.publish("ride.matched", {
//         ...data,
//         retryCount: retryCount + 1
//       });
//     }
//   });
// };

// module.exports = startConsumer;