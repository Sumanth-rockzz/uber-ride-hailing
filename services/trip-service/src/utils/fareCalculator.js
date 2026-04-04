class FareCalculator {
  static calculate({ distanceKm, durationMin, tier = "STANDARD" }) {
    // base configs (can tweak)
    const pricing = {
      STANDARD: {
        baseFare: 50,
        perKm: 10,
        perMin: 2,
      },
      PREMIUM: {
        baseFare: 100,
        perKm: 20,
        perMin: 3,
      },
    };

    const config = pricing[tier] || pricing.STANDARD;

    const fare =
      config.baseFare +
      (distanceKm * config.perKm) +
      (durationMin * config.perMin);

    return Math.round(fare);
  }
}

module.exports = FareCalculator;