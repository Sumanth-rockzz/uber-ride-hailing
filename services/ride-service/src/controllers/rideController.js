class RideController {
  constructor(rideService) {
    this.rideService = rideService;
  }

  createRide = async (req, res) => {
    try {
      const { riderId, pickup, destination } = req.body;

      const ride = await this.rideService.createRide({
        riderId,
        pickup,
        destination
      });

      res.status(201).json(ride);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

module.exports = RideController;