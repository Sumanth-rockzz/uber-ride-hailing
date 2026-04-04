const FareCalculator = require('../utils/fareCalculator');
class TripService {
  constructor(tripRepository, broker) {
    this.tripRepository = tripRepository;
    this.broker = broker;
  }

  async createTrip(data) {
    return await this.tripRepository.createTrip(data);
  }
  
  async getTripById(tripId) {
    return await this.tripRepository.getTripById(tripId);
  }
  
  async completeTrip(tripId) {
    const trip = await this.tripRepository.getTripById(tripId);

    // 👉 simulate or fetch actual values
    const distanceKm = trip.distance_km || 5;     // fallback
    const durationMin = trip.duration_min || 15;  // fallback
    const tier = trip.tier || "STANDARD";

    // 🔥 calculate fare
    const fare = FareCalculator.calculate({
      distanceKm,
      durationMin,
      tier,
    });

    // update DB
    await this.tripRepository.updateTrip(tripId, {
      status: "COMPLETED",
      fare,
    });

    console.log("💰 Fare calculated:", fare);

    // 🔥 THIS IS THE TRIGGER
    await this.broker.publish("trip.completed", {
      tripId: trip.id,
      rideId: trip.ride_id,
      driverId: trip.driver_id,
      amount: trip.fare || 250, // or calculate
    });

    console.log("📤 trip.completed event sent");
}
}

module.exports = TripService;
