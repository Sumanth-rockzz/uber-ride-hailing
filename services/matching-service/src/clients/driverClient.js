// src/clients/driverClient.js
const axios = require('axios');
const driverServiceUrl = process.env.DRIVER_SERVICE_URL || 'http://driver-service:3002';

class DriverClient {
  async findNearbyDrivers(lat, lng) {
    const response = await axios.get(
      `${driverServiceUrl}/api/drivers/nearby`,
      {
        params: { lat, lng, radius: 5 }
      }
    );

    return response.data;
  }
}

module.exports = DriverClient;