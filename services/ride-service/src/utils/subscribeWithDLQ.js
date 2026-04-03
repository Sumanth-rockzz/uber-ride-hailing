// utils/subscribeWithDLQ.js
const subscribeWithDLQ = async (broker, topic, handler) => {
  await broker.subscribe(topic, async (data) => {
    try {
      await handler(data);
    } catch (err) {
      console.error(`❌ Error in ${topic}:`, err.message);

      // send to DLQ
      await broker.publish(`${topic}.DLQ`, data);
    }
  });
};

module.exports = subscribeWithDLQ;