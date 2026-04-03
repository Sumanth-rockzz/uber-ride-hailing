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

  getTripById = async (req, res) => {
    try {
      const { tripId } = req.params;
      const trip = await this.tripService.getTripById(tripId);
      res.status(200).json(trip);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  completeTrip = async (req, res) => {
    try {
      const { tripId } = req.params;
      const trip = await this.tripService.completeTrip(tripId);
      res.status(200).json(trip);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

}


module.exports = TripController;