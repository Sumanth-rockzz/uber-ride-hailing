const express = require('express');
require('dotenv').config();

const RedisBroker = require('./brokers/redisBroker');
const PaymentService = require('./services/paymentService');
const PaymentConsumer = require('./consumers/paymentConsumer');
const PostgresPaymentRepository = require('./repositories/postgresPaymentRepository');
const redis = require('./config/redis');

const PaymentController = require('./controllers/paymentController');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
app.use(express.json());

// DI
const broker = new RedisBroker();
const paymentRepo = new PostgresPaymentRepository();
const paymentService = new PaymentService(broker, paymentRepo, redis);
const paymentConsumer = new PaymentConsumer(broker, paymentService);

const paymentController = new PaymentController(paymentService);

app.use('/api', paymentRoutes(paymentController));

app.get('/health', (req, res) => {
  res.send('Payment Service is running');
});

// Start consumer
paymentConsumer.start();

app.listen(3005, () => {
  console.log('Payment Service running on port 3005');
});