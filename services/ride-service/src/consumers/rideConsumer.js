const subscribeWithDLQ = require('../utils/subscribeWithDLQ');

class RideConsumer {
  constructor(broker, rideService) {
    this.broker = broker;
    this.rideService = rideService;
  }

  async start() {
    console.log("👂 Ride Service listening to events...");

    await subscribeWithDLQ(this.broker, "ride.matched", async (data) => {
      console.log("📥 ride.matched:", data);
      await this.rideService.updateRideStatus(data.rideId, "MATCHED");
    });

    await subscribeWithDLQ(this.broker, "payment.completed", async (data) => {
      console.log("📥 payment.completed:", data);
      await this.rideService.updateRideStatus(data.rideId, "COMPLETED");
    });

    await subscribeWithDLQ(this.broker, "payment.failed", async (data) => {
      console.log("📥 payment.failed:", data);
      await this.rideService.updateRideStatus(data.rideId, "PAYMENT_FAILED");
    });
  }
}

module.exports = RideConsumer;