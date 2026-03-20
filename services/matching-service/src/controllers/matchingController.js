// src/controllers/matchingController.js
class MatchingController {
  constructor(matchingService) {
    this.matchingService = matchingService;
  }

  match = async (req, res) => {
    try {
      const { rideId, pickupLat, pickupLng } = req.body;

      const result = await this.matchingService.matchDriver({
        rideId,
        pickupLat,
        pickupLng
      });

      if (!result) {
        return res.status(404).json({ message: "No drivers available" });
      }

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  };

  accept = async (req, res) => {
    try {
        const { rideId, driverId } = req.body;

        const result = await this.matchingService.acceptDriver(rideId, driverId);

        if (!result.success) {
        return res.status(400).json({ message: "Ride already taken" });
        }

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
  };
}

module.exports = MatchingController;