// src/clients/rideClient.js
const axios = require('axios');
const rideServiceUrl = process.env.RIDE_SERVICE_URL || 'http://ride-service:3001';

class RideClient {
  async updateRideStatus(rideId, status) {
    const response = await axios.patch(
      `${rideServiceUrl}/api/rides/${rideId}/status`,
      { status }
    );

    return response.data;
  }
}

module.exports = RideClient;