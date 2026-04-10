const redis = require('../config/redis');

const rateLimiter = ({ limit = 10, windowSec = 60 }) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.ip;
      const key = `rate:${userId}`;
      const now = Date.now();
      const windowStart = now - windowSec * 1000;

      // 🔥 1. Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart);

      // 🔥 2. Get current count
      const count = await redis.zcard(key);

      if (count >= limit) {
        return res.status(429).json({
          error: "Too many requests, try later",
        });
      }

      // 🔥 3. Add current request
      await redis.zadd(key, now, now);

      // 🔥 4. Set expiry (cleanup)
      await redis.expire(key, windowSec);

      next();
    } catch (err) {
      console.error("Rate limiter error:", err);
      next(); // fail open
    }
  };
};

module.exports = rateLimiter;