// src/brokers/RedisBroker.js
const Redis = require("ioredis");
const MessageBroker = require("./messageBroker");

class RedisBroker extends MessageBroker {
  constructor() {
    super();
    this.publisher = new Redis({
      host: process.env.REDIS_HOST || "redis",
      port: process.env.REDIS_PORT || 6379,
    });

    this.subscriber = new Redis({
      host: process.env.REDIS_HOST || "redis",
      port: process.env.REDIS_PORT || 6379,
    });
  }

  async publish(topic, message) {
    await this.publisher.publish(topic, JSON.stringify(message));
  }

  async subscribe(topic, handler) {
    await this.subscriber.subscribe(topic);

    this.subscriber.on("message", (channel, message) => {
      if (channel === topic) {
        handler(JSON.parse(message));
      }
    });
  }
}

module.exports = RedisBroker;
// src/brokers/RedisBroker.js

// const MessageBroker = require("./messageBroker");

// class RedisBroker extends MessageBroker {
//   constructor() {
//     super();
//     this.publisher = new Redis({
//       host: process.env.REDIS_HOST || "redis",
//       port: process.env.REDIS_PORT || 6379,
//     });

//     this.subscriber = new Redis({
//       host: process.env.REDIS_HOST || "redis",
//       port: process.env.REDIS_PORT || 6379,
//     });
//   }

//   async publish(topic, message) {
//     await this.publisher.publish(topic, JSON.stringify(message));
//   }

//   async subscribe(topic, handler) {
//     await this.subscriber.subscribe(topic);

//     this.subscriber.on("message", (channel, message) => {
//       if (channel === topic) {
//         handler(JSON.parse(message));
//       }
//     });
//   }
// }

// module.exports = RedisBroker;