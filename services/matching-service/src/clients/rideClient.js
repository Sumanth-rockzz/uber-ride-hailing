// src/clients/rideClient.js
const axios = require('axios');

class RideClient {
  async updateRideStatus(rideId, status) {
    const response = await axios.patch(
      `http://localhost:3001/api/rides/${rideId}/status`,
      { status }
    );

    return response.data;
  }
}

module.exports = RideClient;