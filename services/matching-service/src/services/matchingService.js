// src/services/matchingService.js

//const activeMatches = new Map();
const redis = require('../config/redis');

class MatchingService {
  constructor(driverClient, rideClient, tripClient) {
    this.driverClient = driverClient;
    this.rideClient = rideClient;
    this.tripClient = tripClient;
  }

  async matchDriver({ rideId, pickupLat, pickupLng }) {
    const drivers = await this.driverClient.findNearbyDrivers(
      pickupLat,
      pickupLng
    );

    if (!drivers.length) {
      return null;
    }

    // Take top 5 drivers
    const topDrivers = drivers.slice(0, 5);

    return {
        rideId,
        drivers: topDrivers
    };

  }

  async acceptDriver(rideId, driverId) {

    const key = `ride_lock:${rideId}`;

    const isLocked = await redis.set(
        key,
        driverId,
        'NX',   // only set if not exists
        'EX',   // expiry
        30      // 30 seconds lock
    );

    if (!isLocked) {
        return { success: false };
    }
    
    await this.rideClient.updateRideStatus(rideId, 'MATCHED');

    const trip = await this.tripClient.createTrip(rideId, driverId);

    return {
        success: true,
        rideId,
        driverId,
        trip
    };
  }

}

module.exports = MatchingService;