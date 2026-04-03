// // kafka/dlqConsumer.js

// const kafka = require('../config/kafka');

// const consumer = kafka.consumer({ groupId: 'dlq-group' });

// const startDLQConsumer = async () => {

//   await consumer.connect();
//   await consumer.subscribe({ topic: 'ride.matched.DLQ' });

//   await consumer.run({
//     eachMessage: async ({ message }) => {
//       const data = JSON.parse(message.value.toString());

//       console.log("🚨 DLQ EVENT:", data);

//       // future:
//       // - alert system
//       // - manual retry
//       // - monitoring dashboard
//     }
//   });
// };

// module.exports = startDLQConsumer;


// kafka/dlqConsumer.js


// const redisBroker = require('../brokers/redisBroker');

// const startDLQConsumer = async () => {
//   await redisBroker.subscribe("ride.matched.DLQ");
//   await redisBroker.subscribe("payment.completed.DLQ");
//   await redisBroker.subscribe("payment.failed.DLQ");

//   console.log("⚠️ DLQ listening...");

//   redisBroker.subscriber.on("message", (channel, message) => {
//     const data = JSON.parse(message);

//     if (channel === "ride.matched.DLQ") {
//       console.log("🚨 DLQ EVENT (ride.matched):", data);
//     }

//     else if (channel === "payment.completed.DLQ") {
//       console.log("🚨 DLQ EVENT (payment.completed):", data);
//     }

//     else if (channel === "payment.failed.DLQ") {
//       console.log("🚨 DLQ EVENT (payment.failed):", data);
//     }
//   });
// };

// module.exports = startDLQConsumer;