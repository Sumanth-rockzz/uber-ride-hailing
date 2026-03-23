// trip-service/src/kafka/consumer.js
const kafka = require('../config/kafka');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const consumer = kafka.consumer({ groupId: 'trip-group' });

const startConsumer = async (tripService) => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'ride.matched' });

  await consumer.run({
    eachMessage: async ({ message }) => {

      const data = JSON.parse(message.value.toString());
      console.log("trip service kafka message received", data);
      try {
        await tripService.createTrip(data);
        console.log('Trip created via Kafka');
      } catch (error) {
        console.error('Error creating trip via Kafka:', error);

        const retryCount = data.retryCount || 0;

        if (retryCount >= 3) {
          // 👉 Send to DLQ
          await sendEvent('ride.matched.DLQ', data);
          console.log("Moved to DLQ 🚨");
          return;
        } 
            // 🔥 Backoff time
        const delays = [3000, 5000, 10000];
        const delay = delays[retryCount] || 10000;

        console.log(`Retrying after ${delay} ms`);

        await sleep(delay);
        // 👉 Retry by re-publishing
        await sendEvent('ride.matched', {
        ...data,
        retryCount: retryCount + 1
        });


      }
    }
  });
};

module.exports = startConsumer ;