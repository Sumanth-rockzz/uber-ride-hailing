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

  getRide = async (req, res) => {
    try {
      const { id } = req.params;

      const ride = await this.rideService.getRideById(id);

      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      res.json(ride);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  };

  updateRideStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      if (!id){
        return res.status(400).json({ message: "Ride ID is required" });
      }

      const ride = await this.rideService.updateRideStatus(id, status);

      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      res.json(ride);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  };
}

module.exports = RideController;