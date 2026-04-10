# High Level Design (HLD)

## System Goal

The repository implements the backend of a ride-hailing platform with separate services for ride creation, driver tracking, matching, trip lifecycle, payments, and notifications.

The current design prioritizes:

- separation of concerns across services
- fast real-time lookup with Redis
- async propagation of state changes
- basic idempotency and race-condition handling

## High-Level Architecture

```text
Microservices + Express + Redis + Postgres + Docker Compose
```

Although Kafka abstractions exist, the running path in this codebase currently relies on Redis Pub/Sub.

## Core Services

### Ride Service

- Owns ride creation and ride reads
- Persists ride state in Postgres
- Reacts to downstream events such as `ride.matched` and payment outcomes

### Driver Service

- Maintains live driver coordinates in Redis GEO
- Supports low-latency nearby-driver lookup

### Matching Service

- Finds candidate drivers for a ride
- Handles driver acceptance
- Uses Redis idempotency and distributed locking to reduce double assignment

### Trip Service

- Creates trips when a ride is matched
- Completes trips and calculates fare
- Retries failed asynchronous trip creation

### Payment Service

- Processes a payment when a trip completes
- Prevents duplicate payment execution with Redis lock state
- Emits success or failure events

### Notification Service

- Subscribes to internal events
- Logs notifications
- Serves as the placeholder for later SMS, push, or email integration

## Infrastructure Components

### Redis

Redis is part of the hot path for:

- driver location indexing
- ride state checks
- ride acceptance locking
- matching idempotency
- payment idempotency
- inter-service Pub/Sub

### PostgreSQL

Postgres is used as the durable store for:

- rides
- trips
- payments

### Docker Compose

`docker-compose.yml` defines the local environment for:

- all six services
- Redis
- PostgreSQL

Kafka and Zookeeper entries exist but are commented out.

## Communication Model

### Sync Path

HTTP is used when an immediate response is needed:

- create ride
- update driver location
- fetch nearby drivers
- match ride candidates
- accept ride
- create or complete trip
- fetch payment record

### Async Path

Redis Pub/Sub is used for cross-service propagation:

- `ride.matched`
- `trip.completed`
- `payment.completed`
- `payment.failed`

## Important Design Decisions

### 1. Real-Time Driver Search With Redis GEO

This keeps nearby-driver lookup fast and avoids geospatial queries in Postgres for the active path.

### 2. Distributed Locking During Acceptance

`ride_lock:{rideId}` is used so only one driver can win the assignment flow.

### 3. Idempotent Acceptance And Payment

Redis keys such as `idem:{key}` and `payment:{tripId}` reduce duplicate execution from retries or repeated requests.

### 4. Event-Driven Status Propagation

Ride, trip, and payment state changes are propagated asynchronously so each service stays relatively isolated.

### 5. DLQ-Style Retry Handling

Trip creation has retry and DLQ behavior. Ride Service also listens to `.DLQ` channels for failed downstream status updates.

## Current Functional Flow

```text
1. Rider creates ride
2. Matching service fetches nearby drivers
3. Driver accepts ride
4. Matching service publishes ride.matched
5. Ride service marks ride as MATCHED
6. Trip service creates trip
7. Trip completion publishes trip.completed
8. Payment service processes payment
9. Ride service marks ride completed on payment success
10. Notification service logs emitted events
```

## Known Gaps At High Level

- Kafka is scaffolded but not active
- Notification delivery is not implemented beyond logging
- Some route and schema details are still inconsistent with service code
- Redis Pub/Sub does not provide durable event retention

## Summary

The current HLD is a pragmatic microservice backend with Redis-centered real-time behavior and Postgres-backed persistence. It already covers the main ride lifecycle, while still leaving room to harden durability, schema consistency, and broker infrastructure.
