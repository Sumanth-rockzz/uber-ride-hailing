const redis = require('../config/redis');
class RideService {
  constructor(rideRepository, broker) {
    this.rideRepository = rideRepository;
    this.broker = broker;
  }

  async createRide(data) {
    const ride = await this.rideRepository.createRide(data);
    await redis.set(`ride:${data.id}`, 'REQUESTED');
    return ride;
  }

  async getRideById(id) {
    return await this.rideRepository.getRideById(id);
  }

  async updateRideStatus(id, status) {
    const allowedStatus = ["REQUESTED", "MATCHED", "STARTED", "COMPLETED", "CANCELLED"];

    if (!allowedStatus.includes(status)) {
      throw new Error("Invalid status");
    }
    
    return await this.rideRepository.updateRideStatus(id, status);
  }
}

module.exports = RideService;
