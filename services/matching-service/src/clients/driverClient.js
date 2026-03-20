// src/clients/driverClient.js
const axios = require('axios');

class DriverClient {
  async findNearbyDrivers(lat, lng) {
    const response = await axios.get(
      `http://localhost:3002/api/drivers/nearby`,
      {
        params: { lat, lng, radius: 5 }
      }
    );

    return response.data;
  }
}

module.exports = DriverClient;