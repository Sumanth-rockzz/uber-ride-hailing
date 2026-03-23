// src/services/matchingService.js

//const activeMatches = new Map();
const redis = require('../config/redis');
const kafkaProducer = require('../kafka/producer');
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

  async acceptDriver(rideId, driverId, idempotencyKey) {
    try {
      const key = `ride_lock:${rideId}`;

      const idemKey = `idem:${idempotencyKey}`;

      const alreadyProcessed = await redis.set(
        idemKey,
        "PROCESSING",
        'NX',
        'EX',
        300
      );

      if (!alreadyProcessed) {
        return { success: true, message: "Already processed" };
      }

      const rideStatus = await redis.get(`ride:${rideId}`);

      if (rideStatus === 'MATCHED') {
        return { success: false, message: 'Ride already matched' };
      }

      const isLocked = await redis.set(
        key,
        driverId,
        'NX', // only set if not exists
        'EX', // expiry
        30    // 30 seconds lock
      );

      if (!isLocked) {
        return { success: false };
      }

      await redis.set(`ride:${rideId}`, 'MATCHED');

      await kafkaProducer.sendEvent('ride.matched', {
        rideId,
        driverId,
        retryCount: 0,
      });

      return { success: true, rideId, driverId };
    } catch (err) {
      console.error("FAILED FLOW", err);

      return { success: false, message: "Internal error" };
    }
  }

}

module.exports = MatchingService;