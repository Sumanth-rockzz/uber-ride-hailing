const pub = require('../config/redis')

const sendEvent = async (channel, message) => {
  try {
    await pub.publish(channel, JSON.stringify(message));
    console.log("📤 Event published:", channel, message);
  } catch (err) {
    console.error("Publish failed ❌", err.message);
  }
};

module.exports = sendEvent;