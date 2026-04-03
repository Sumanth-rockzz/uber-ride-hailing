const kafka = require('../config/kafka');

class KafkaBroker {
  constructor() {
    this.producer = kafka.producer();
    this.consumer = kafka.consumer({ groupId: 'driver-group' });
  }

  async connectProducer() {
    let retries = 10;
    const delay = 5000; // 5 sec

    while (retries > 0) {
      try {
        console.log(`Connecting to Kafka... (${11 - retries}/10)`);
        await this.producer.connect();
        console.log("✅ Kafka connected");
        return;
      } catch (err) {
        console.error("❌ Kafka connection failed:", err.message);
        retries--;

        if (retries === 0) {
          console.error("🚨 Kafka connection exhausted. Exiting...");
          process.exit(1);
        }

        console.log(`Retrying in ${delay / 1000}s...\n`);
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }

  async connectConsumer() {
    try {
      await this.consumer.connect();
      console.log("Kafka consumer connected ✅");
    } catch (err) {
      console.error("Kafka consumer connection failed ❌", err.message);
    }
  }

  async publish(topic, message) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async subscribe(topic, handler) {
    await this.consumer.subscribe({ topic });
    
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const data = JSON.parse(message.value.toString());
        handler(data);
      }
    });
  }
}

module.exports = KafkaBroker;
