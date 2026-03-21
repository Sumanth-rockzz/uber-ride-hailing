class TripService {
  constructor(tripRepository) {
    this.tripRepository = tripRepository;
  }

  async createTrip(data) {
    return await this.tripRepository.createTrip(data);
  }
}

module.exports = TripService;
