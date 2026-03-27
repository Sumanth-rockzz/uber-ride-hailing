// src/kafka/producer.js
const kafka = require('../config/kafka');

const producer = kafka.producer();

const connectProducer = async () => {
  let retries = 10;
  const delay = 5000; // 5 sec

  while (retries > 0) {
    try {
      console.log(`Connecting to Kafka... (${11 - retries}/10)`);
      await producer.connect();
      console.log("✅ Kafka connected");
      return;
    } catch (err) {
      console.error("❌ Kafka connection failed:", err.message);
      retries--;

      if (retries === 0) {
        console.error("🚨 Kafka connection exhausted. Exiting...");
        process.exit(1); // important for container restart
      }

      console.log(`Retrying in ${delay / 1000}s...\n`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
};
const sendEvent = async (topic, message) => {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
};

module.exports = { connectProducer, sendEvent };