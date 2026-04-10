# Architecture Design

## Overview

This repository implements a ride-hailing backend as a set of independent Node.js microservices. The current runtime topology is Docker-based, with PostgreSQL for persistence, Redis for real-time state and Pub/Sub, and service-to-service HTTP for synchronous coordination.

Kafka client code is present in several services, but the active startup paths in the working tree use Redis Pub/Sub instead of Kafka.

## Service Topology

```text
Client
  |
  +--> Ride Service (3001) ---------> Postgres
  |
  +--> Driver Service (3002) -------> Redis GEO
  |
  +--> Matching Service (3003) -----> Driver Service / Ride Service / Trip Service
  |
  +--> Trip Service (3004) ---------> Postgres
  |
  +--> Payment Service (3005) ------> Postgres + Redis
  |
  +--> Notification Service (3006)

Shared Infrastructure:
- Redis 7 on 6379
- Postgres 15 on host port 5433
```

## Responsibilities By Service

### Ride Service

- Creates rides in Postgres
- Reads rides by id
- Updates ride status through HTTP
- Subscribes to `ride.matched`, `payment.completed`, and `payment.failed`
- Handles corresponding DLQ channels

### Driver Service

- Stores driver coordinates in Redis GEO under `drivers:locations`
- Returns nearby drivers based on radius search

### Matching Service

- Fetches nearby drivers from Driver Service
- Runs the acceptance path for driver assignment
- Uses Redis for idempotency and ride locking
- Publishes `ride.matched`

### Trip Service

- Creates trip records
- Subscribes to `ride.matched`
- Retries failed trip creation up to 3 times
- Publishes to `ride.matched.DLQ` after retry exhaustion
- Completes trips and emits `trip.completed`

### Payment Service

- Subscribes to `trip.completed`
- Uses Redis key locking for payment idempotency
- Persists successful and failed payments
- Publishes `payment.completed` or `payment.failed`

### Notification Service

- Subscribes to ride, trip, and payment events
- Logs notifications
- Does not yet persist or deliver via external channels

## Communication Patterns

### Synchronous HTTP

The current direct HTTP dependencies are:

- Client -> Ride Service
- Client -> Driver Service
- Client -> Matching Service
- Client -> Trip Service
- Client -> Payment Service
- Matching Service -> Driver Service
- Matching Service -> Ride Service
- Matching Service -> Trip Service

### Asynchronous Pub/Sub

The active event transport is Redis Pub/Sub:

```text
Matching Service -- ride.matched --> Ride Service
                                  -> Trip Service
                                  -> Notification Service

Trip Service ---- trip.completed --> Payment Service
                                   -> Notification Service

Payment Service - payment.* ------> Ride Service
                                   -> Notification Service
```

## Data Ownership

The codebase trends toward per-service ownership, but the current schema is still narrow and shared:

- Ride Service primarily uses `rides`
- Trip Service primarily uses `trips`
- Payment Service primarily uses `payments`
- Driver Service uses Redis instead of Postgres
- Notification Service is stateless in the current implementation

## Redis Usage

Redis is not just cache in this repository. It is part of the core control plane.

Current key and channel usage:

- `drivers:locations` for GEO proximity queries
- `ride:{rideId}` for lightweight ride state
- `ride_lock:{rideId}` for distributed assignment locking
- `idem:{idempotencyKey}` for matching idempotency
- `payment:{tripId}` for payment idempotency / in-progress locking
- Pub/Sub channels such as `ride.matched`, `trip.completed`, `payment.completed`, and `payment.failed`

## Postgres Usage

Postgres is the durable store for rides, trips, and payments.

Current bootstrap schema from [`docker/postgres/init.sql`](/Users/sumanthrockzz/new-projects/Uber%20Clone/docker/postgres/init.sql):

- `rides`
- `trips`
- `payments`

There is one notable implementation gap:

- Payment service code writes `ride_id` and `payment_id`
- The checked-in `init.sql` currently creates `payments(trip_id, amount, status, transaction_id, created_at)`

That means the documentation should be read as "current code intent plus current schema reality", not as a fully reconciled production contract.

## Runtime Characteristics

### What Is Production-Like

- Clear service boundaries
- Dependency injection inside each service
- Retry and DLQ handling around trip creation
- Redis-based concurrency control for critical acceptance and payment flows

### What Is Transitional

- Kafka is scaffolded but not active
- Some services expose only minimal APIs
- Notification service is log-only
- Payment route is effectively mounted at `/api/api/payments/:tripId`
- A few schema and code assumptions are not yet fully synchronized

## Deployment Notes

From [`docker-compose.yml`](/Users/sumanthrockzz/new-projects/Uber%20Clone/docker-compose.yml):

- Ride Service depends on Redis and Postgres
- Driver Service depends on Redis
- Matching Service depends on Redis and Driver Service
- Trip Service depends on Postgres
- Payment Service depends on Redis
- Notification Service depends on Redis
- Kafka and Zookeeper are present but commented out

## Architectural Summary

The current architecture is best described as:

```text
Microservices + Express + Postgres + Redis GEO + Redis Pub/Sub
```

It already demonstrates the main distributed-system patterns needed for a ride flow: service isolation, async event propagation, idempotency, distributed locking, retries, and DLQ handling. The main unfinished area is consistency between code, schema, and the dormant Kafka path.
