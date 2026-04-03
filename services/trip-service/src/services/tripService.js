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

    await this.tripRepository.updateStatus(tripId, "COMPLETED");

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
