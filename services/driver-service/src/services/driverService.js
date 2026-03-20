class DriverService {
  constructor(driverRepository) {
    this.driverRepository = driverRepository;
  }

  async updateLocation(driverId, lat, lng) {
    return await this.driverRepository.updateLocation(driverId, lat, lng);
  }

  async findNearbyDrivers(lat, lng, radius) {
    return await this.driverRepository.findNearbyDrivers(lat, lng, radius);
  }
}

module.exports = DriverService;