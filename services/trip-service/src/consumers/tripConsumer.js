class TripConsumer {
  constructor(broker, tripService) {
    this.broker = broker;
    this.tripService = tripService;
  }

  async start() {
    console.log("👂 Trip Service listening to ride.matched...");

    await this.broker.subscribe("ride.matched", async (data) => {
      console.log("📥 ride.matched received:", data);

      try {
        await this.tripService.createTrip(data);
        console.log("Trip created via Redis ✅");
      } catch (error) {
        console.error("Error creating trip ❌", error.message);

        if (error.code === "23505") {
          console.log("Duplicate trip ignored ✅");
          return;
        }

        const retryCount = data.retryCount || 0;

        if (retryCount >= 3) {
          await this.broker.publish("ride.matched.DLQ", data);
          console.log("Moved to DLQ 🚨");
          return;
        }

        const delays = [3000, 5000, 10000];
        const delay = delays[retryCount] || 10000;

        console.log(`Retrying after ${delay} ms`);

        await new Promise(resolve => setTimeout(resolve, delay));

        await this.broker.publish("ride.matched", {
          ...data,
          retryCount: retryCount + 1
        });
      }
    });
  }
}

module.exports = TripConsumer;
