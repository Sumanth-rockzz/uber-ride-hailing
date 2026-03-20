class DriverRepository {
  async updateLocation(driverId, lat, lng) {
    throw new Error("Not implemented");
  }
  
  async findNearbyDrivers(lat, lng, radius) {
    throw new Error("Not implemented");
  }
}

module.exports = DriverRepository;