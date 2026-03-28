const Redis = require('ioredis');

const sub = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
});

module.exports = sub;