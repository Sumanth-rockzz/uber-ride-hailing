class PaymentController {
  constructor(paymentService) {
    this.paymentService = paymentService;
  }

  getPayment = async (req, res) => {
    try {
      const { tripId } = req.params;

      const payment = await this.paymentService.paymentRepo.findByTripId(tripId);

      res.status(200).json(payment);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

module.exports = PaymentController;