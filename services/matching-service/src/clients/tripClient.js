// src/clients/tripClient.js
const axios = require('axios');
const tripServiceUrl = process.env.TRIP_SERVICE_URL || 'http://trip-service:3004';

class TripClient {
  async createTrip(rideId, driverId) {
    const response = await axios.post(
      `${tripServiceUrl}/api/trips`,
      { rideId, driverId }
    );

    return response.data;
  }
}

module.exports = TripClient;