// src/consumers/paymentConsumer.js
class PaymentConsumer {
  constructor(broker, paymentService) {
    this.broker = broker;
    this.paymentService = paymentService;
  }

  async start() {
    console.log("💳 Listening to trip.completed...");

    await this.broker.subscribe("trip.completed", async (data) => {
      console.log("📥 trip.completed received:", data);

      await this.paymentService.processPayment(data);
    });
  }
}

module.exports = PaymentConsumer;