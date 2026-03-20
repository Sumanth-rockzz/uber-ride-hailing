class DriverController {
  constructor(driverService) {
    this.driverService = driverService;
  }

  updateLocation = async (req, res) => {
    try {
      const { id } = req.params;
      const { lat, lng } = req.body;

      if (!id || !lat || !lng) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await this.driverService.updateLocation(id, lat, lng);

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  };

  findNearbyDrivers = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    const drivers = await this.driverService.findNearbyDrivers(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius) || 3
    );

    res.json(drivers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
}

module.exports = DriverController;