class RideDLQConsumer {
  constructor(broker, rideService) {
    this.broker = broker;
    this.rideService = rideService;
  }

  async start() {
    console.log("👂 Ride DLQ Service listening to events...");

    await this.broker.subscribe("ride.matched.DLQ", async (data) => {
      console.log("📥 ride.matched received:", data);
      await this.rideService.updateRideStatus(data.rideId, "MATCHED");
      console.log("Ride updated to MATCHED ✅");
    });

    await this.broker.subscribe("payment.completed.DLQ", async (data) => {
      console.log("📥 payment.completed received:", data);
      await this.rideService.updateRideStatus(data.rideId, "COMPLETED");
      console.log("Ride updated to COMPLETED 💰✅");
    });

    await this.broker.subscribe("payment.failed.DLQ", async (data) => {
      console.log("📥 payment.failed received:", data);
      await this.rideService.updateRideStatus(data.rideId, "PAYMENT_FAILED");
      console.log("Ride updated to PAYMENT_FAILED ❌");
    });
  }
}

module.exports = RideDLQConsumer;
