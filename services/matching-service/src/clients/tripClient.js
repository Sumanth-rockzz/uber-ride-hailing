// src/clients/tripClient.js
const axios = require('axios');

class TripClient {
  async createTrip(rideId, driverId) {
    const response = await axios.post(
      'http://localhost:3004/api/trips',
      { rideId, driverId }
    );

    return response.data;
  }
}

module.exports = TripClient;