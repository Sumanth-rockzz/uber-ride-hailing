const redis = require('../config/redis');

class RedisDriverRepository {
  async updateLocation(driverId, lat, lng) {
    await redis.geoadd(
      'drivers:locations',
      lng,
      lat,
      driverId
    );

    return { driverId, lat, lng };
  }

  async findNearbyDrivers(lat, lng, radius = 3) {
  const drivers = await redis.georadius(
    'drivers:locations',
    lng,
    lat,
    radius,
    'km',
    'WITHDIST'
  );

  return drivers;
}
}

module.exports = RedisDriverRepository;