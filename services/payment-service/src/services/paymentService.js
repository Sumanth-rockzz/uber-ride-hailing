// src/services/paymentService.js
class PaymentService {
  constructor(broker, paymentRepo, redis) {
    this.broker = broker;
    this.paymentRepo = paymentRepo;
    this.redis = redis;
  }

  async processPayment(data) {
    const { tripId, rideId, amount } = data;

    const key = `payment:${tripId}`;

    // 🔒 Try to acquire lock (idempotency + concurrency control)
    const lock = await this.redis.set(key, "PROCESSING", "NX", "EX", 300);

    if (!lock) {
        console.log("⚠️ Payment already in progress or processed");
        return;
    }

    console.log("💰 Processing payment...");

    try {
        // simulate delay
        await new Promise(res => setTimeout(res, 2000));

        const success = Math.random() > 0.2;

        if (success) {
        const paymentId = `pay_${Date.now()}`;

        // ✅ Update Redis with final state
        await this.redis.set(
            key,
            JSON.stringify({
            status: "SUCCESS",
            paymentId,
            }),
            "EX",
            86400
        );

        // ✅ Persist (only after success)
        await this.paymentRepo.createPayment({
            tripId,
            rideId,
            amount,
            status: "SUCCESS",
            paymentId,
        });

        // ✅ Emit event
        await this.broker.publish("payment.completed", {
            tripId,
            rideId,
            status: "SUCCESS",
            paymentId,
        });

        console.log("✅ Payment success");

        } else {
        // ❌ Fail fast → allow retry
        await this.redis.del(key);

        await this.paymentRepo.createPayment({
            tripId,
            rideId,
            amount,
            status: "FAILED",
            paymentId: null,
        });

        await this.broker.publish("payment.failed", {
            tripId,
            rideId,
            status: "FAILED",
        });

        console.log("❌ Payment failed");
        }

    } catch (err) {
        // 🔥 critical: release lock on failure
        await this.redis.del(key);

        console.error("🚨 Payment error:", err.message);
        throw err;
    }
    }
}

module.exports = PaymentService;