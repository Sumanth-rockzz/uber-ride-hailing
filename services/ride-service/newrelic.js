'use strict'

exports.config = {
  app_name: ['ride-service'], // change per service
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info',
  },
};