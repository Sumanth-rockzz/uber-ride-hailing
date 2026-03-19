class RideService {
  constructor(rideRepository) {
    this.rideRepository = rideRepository;
  }

  async createRide(data) {
    return await this.rideRepository.createRide(data);
  }
}

module.exports = RideService;