class NotificationConsumer {
  constructor(broker, notificationService) {
    this.broker = broker;
    this.notificationService = notificationService;
  }

  async start() {
    console.log("🔔 Notification service listening...");

    const events = [
      "ride.matched",
      "trip.started",
      "trip.completed",
      "payment.completed",
      "payment.failed",
    ];

    for (const event of events) {
      await this.broker.subscribe(event, async (data) => {
        console.log(`📥 Event received: ${event}`);

        await this.notificationService.send(event, data);
      });
    }
  }
}

module.exports = NotificationConsumer;