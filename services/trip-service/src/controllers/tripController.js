class TripController {
  constructor(tripService) {
    this.tripService = tripService;
  }

  createTrip = async (req, res) => {
    try {
      const { rideId, driverId } = req.body;

      const trip = await this.tripService.createTrip({
        rideId,
        driverId,
      });

      res.status(201).json(trip);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

}


module.exports = TripController;