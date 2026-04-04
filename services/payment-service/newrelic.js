'use strict'

exports.config = {
  app_name: ['payment-service'], // change per service
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info',
  },
};