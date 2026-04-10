# Interview Guide: Uber Clone Backend

## 1. High-Level Overview

### What the project does

This project is a microservices-based backend for a ride-hailing platform similar to Uber. It handles ride creation, driver location tracking, ride-to-driver matching, trip creation and completion, payment processing, and event-based notifications.

### Problem it solves

A ride-hailing system has two hard problems:

- real-time coordination between riders, drivers, and backend services
- safe handling of concurrent actions such as multiple drivers accepting the same ride

This repository solves that by splitting responsibilities across focused services and using Redis for low-latency state, locking, and pub/sub.

### Key features

- Ride creation and status management
- Driver location tracking using Redis GEO
- Nearby driver discovery
- Driver acceptance flow with idempotency and distributed locking
- Trip creation and completion
- Payment processing with retry-safe locking
- Event-driven updates between services
- Dockerized local setup with Postgres and Redis

## 2. Tech Stack

### Languages, frameworks, and libraries

- JavaScript (Node.js)
- Express
- PostgreSQL with `pg`
- Redis with `ioredis`
- Axios
- Docker and Docker Compose
- New Relic
- KafkaJS present in code, but not active in the current runtime path

### Why they are used

- Node.js: good for I/O-heavy microservices and fast API development
- Express: lightweight routing and middleware layer
- PostgreSQL: durable relational storage for rides, trips, and payments
- Redis: fast in-memory store for driver location, ride state, locks, idempotency keys, and pub/sub
- Axios: internal service-to-service HTTP communication
- Docker Compose: easy local orchestration of multiple services
- New Relic: application monitoring and observability
- KafkaJS: the codebase is prepared for a more durable event bus, even though Redis Pub/Sub is currently active

## 3. Project Structure

### Root

- `docker-compose.yml`: runs all services plus Redis and Postgres
- `docker/postgres/init.sql`: initializes core tables
- `docs/`: architecture and design notes
- `services/`: all microservices
- `AGENTS.md`: repository instructions

### Services

Each service follows a common layered structure:

- `src/index.js`: service entry point and dependency wiring
- `src/routes/`: HTTP route registration
- `src/controllers/`: request handling and input extraction
- `src/services/`: business logic
- `src/repositories/`: database or Redis data access
- `src/brokers/`: message broker abstraction, currently Redis-backed in live flow
- `src/consumers/`: async event listeners
- `src/config/`: Redis, DB, or Kafka config

### Important services

- `services/ride-service`: manages ride lifecycle
- `services/driver-service`: updates and queries driver locations
- `services/matching-service`: finds candidate drivers and handles acceptance
- `services/trip-service`: creates and completes trips
- `services/payment-service`: processes trip payments
- `services/notification-service`: consumes events and logs notifications

## 4. End-to-End Flow

### Step-by-step system flow

#### 1. Ride request

- Client calls `POST /api/rides` on Ride Service
- Ride Service stores a ride row in Postgres with status `REQUESTED`
- Ride Service returns the ride record

#### 2. Driver location updates

- Drivers call `POST /api/drivers/:id/location`
- Driver Service stores coordinates in Redis GEO set `drivers:locations`

#### 3. Nearby driver lookup

- Client or orchestrator calls `POST /api/match`
- Matching Service calls Driver Service `GET /api/drivers/nearby`
- Driver Service queries Redis GEO and returns nearby drivers
- Matching Service returns the top candidate list

#### 4. Driver accepts ride

- Driver calls `POST /api/match/accept`
- Matching Service checks idempotency using `idem:{idempotencyKey}`
- Matching Service checks ride state in Redis
- Matching Service acquires distributed lock `ride_lock:{rideId}`
- Matching Service marks the ride as `MATCHED` in Redis
- Matching Service publishes `ride.matched`

#### 5. Async consumers react

- Ride Service consumes `ride.matched` and updates the ride row in Postgres
- Trip Service consumes `ride.matched` and creates a trip row
- Notification Service logs the event

#### 6. Trip completion

- Client calls `POST /api/trips/:tripId/complete`
- Trip Service calculates fare and updates trip status to `COMPLETED`
- Trip Service publishes `trip.completed`

#### 7. Payment processing

- Payment Service consumes `trip.completed`
- It uses Redis key `payment:{tripId}` to avoid duplicate processing
- It writes payment data and publishes either `payment.completed` or `payment.failed`

#### 8. Final ride update

- Ride Service consumes payment result events
- On payment success, it updates ride status to `COMPLETED`
- Notification Service logs the final event

### Request -> processing -> response lifecycle

For any API request, the pattern is:

```text
Route -> Controller -> Service -> Repository / Broker -> Response
```

Example for ride creation:

```text
POST /api/rides
-> rideRoutes
-> RideController.createRide
-> RideService.createRide
-> PostgresRideRepository.createRide
-> Postgres INSERT
-> JSON response
```

For async processing, the pattern is:

```text
Event published -> Consumer -> Service -> Repository -> Side effect / next event
```

## 5. Core Components Deep Dive

### Ride Service

#### `RideController`

- receives ride create, fetch, and status update requests
- validates required fields at a basic level

#### `RideService`

- encapsulates ride business rules
- updates ride state in storage
- reacts to async payment and matching results

#### `PostgresRideRepository`

- inserts ride records
- fetches rides by id
- updates ride status in Postgres

#### `RideConsumer`

- listens to `ride.matched`, `payment.completed`, and `payment.failed`

### Driver Service

#### `DriverController`

- handles location updates and nearby-driver lookups

#### `RedisDriverRepository`

- writes GEO coordinates
- fetches nearby drivers using `GEORADIUS`

### Matching Service

#### `MatchingService`

This is the main coordination engine.

Responsibilities:

- call Driver Service for nearby drivers
- return candidate drivers
- protect acceptance flow using idempotency and locking
- publish `ride.matched`

#### `DriverClient`, `RideClient`, `TripClient`

- wrap internal HTTP calls between services
- keep service logic cleaner by separating transport concerns

### Trip Service

#### `TripService`

- creates trips from matched rides
- completes trips
- calculates fare using `FareCalculator`
- publishes `trip.completed`

#### `TripConsumer`

- listens to `ride.matched`
- retries failures with backoff
- sends exhausted failures to DLQ-style channels

### Payment Service

#### `PaymentService`

- processes a payment after trip completion
- prevents duplicate execution using Redis lock state
- stores payment record
- publishes success or failure event

### Notification Service

#### `NotificationConsumer` and `NotificationService`

- subscribe to ride, trip, and payment events
- log notifications
- represent a placeholder for push, SMS, or email integrations

## 6. Data Flow

### Persistent data

- `rides` table: created and updated by Ride Service
- `trips` table: created and updated by Trip Service
- `payments` table: created by Payment Service

### Real-time data

- `drivers:locations`: live GEO coordinates in Redis
- `ride:{rideId}`: fast ride state
- `ride_lock:{rideId}`: acceptance lock
- `idem:{idempotencyKey}`: duplicate-request protection
- `payment:{tripId}`: payment lock / state

### Event flow

```text
Matching Service -> ride.matched -> Ride Service + Trip Service + Notification Service
Trip Service -> trip.completed -> Payment Service + Notification Service
Payment Service -> payment.completed / payment.failed -> Ride Service + Notification Service
```

## 7. Design Decisions

### Why microservices

- separates responsibilities clearly
- allows independent scaling of hot services like matching or driver tracking
- keeps each service easier to reason about

Trade-off:

- more operational complexity
- more network calls
- eventual consistency across services

### Why Redis for real-time flows

- GEO queries are fast for nearby-driver search
- locks and idempotency keys are simple to implement
- pub/sub is lightweight for service events

Trade-off:

- Redis Pub/Sub is not durable
- if a subscriber is down, events can be lost

### Why Postgres for durable storage

- reliable transactional storage
- good fit for rides, trips, and payments

Trade-off:

- not ideal for high-frequency geospatial updates in the hot path compared to Redis

### Why layered architecture

- controller/service/repository separation keeps code maintainable
- data access, business logic, and transport concerns stay isolated

Trade-off:

- more files and indirection for a small codebase

## 8. Scalability & Improvements

### How to scale this system

- run multiple instances of stateless services behind a load balancer
- move from Redis Pub/Sub to Kafka for durable event streaming
- shard or region-partition driver location data
- add read replicas for Postgres
- use API gateway and service discovery
- add background workers for notifications and payment retries

### Practical improvements

- fix code/schema mismatches in trip and payment persistence
- add authentication and authorization
- add validation with a schema library like Joi or Zod
- add automated tests for controllers, services, and consumers
- add proper DLQ infrastructure with durable retry queues
- expose metrics, tracing, and structured logs
- replace random payment simulation with a real payment adapter
- store notification history
- add health checks for Redis and Postgres connectivity
- enable Kafka fully if durable events are required

## 9. Interview Explanation Script

This project is a backend for an Uber-like ride-hailing platform built using Node.js microservices. The system is split into services for rides, drivers, matching, trips, payments, and notifications. Each service follows a layered structure with routes, controllers, services, and repositories, which makes responsibilities clear and easy to scale independently.

The most important design choice is using Redis for real-time operations. Driver locations are stored with Redis GEO commands, and the matching service uses Redis for ride state, distributed locking, and idempotency. That is important because in a real system multiple drivers may try to accept the same ride at the same time, so the lock prevents duplicate assignment. PostgreSQL is used for durable business data like rides, trips, and payments.

The end-to-end flow is: a rider creates a ride, the matching service finds nearby drivers through the driver service, one driver accepts, and that publishes a `ride.matched` event. The ride service updates ride state, the trip service creates a trip, and when the trip is completed it publishes `trip.completed`. Then the payment service processes payment and emits either success or failure, and the ride service updates the final ride status.

From an interview perspective, I would highlight that the project demonstrates microservice communication, eventual consistency, distributed locking, idempotency, retry handling, and service decomposition. I would also mention the main improvement areas: replacing Redis Pub/Sub with Kafka for durability, improving schema consistency, and adding stronger validation and testing.

## 10. Key Interview Talking Points

- It is a microservices-based ride-hailing backend, not a monolith.
- Redis is central for real-time coordination, not just caching.
- The critical engineering challenge solved here is concurrent ride acceptance.
- Postgres stores durable business records, while Redis handles the hot path.
- Event-driven communication decouples services but introduces eventual consistency.
- The codebase already shows production concepts like retries, DLQ flow, and observability hooks.
- The biggest next step is upgrading from lightweight Redis Pub/Sub to durable messaging and tightening schema correctness.

## Final Summary

If I had to describe this project in one line:

> It is a microservices-based Uber clone backend that uses Redis for real-time matching and coordination, Postgres for persistence, and event-driven communication to manage the ride lifecycle end to end.
