class MessageBroker {
  async publish(topic, message) {
    throw new Error("publish() not implemented");
  }

  async subscribe(topic, handler) {
    throw new Error("subscribe() not implemented");
  }
}

module.exports = MessageBroker;