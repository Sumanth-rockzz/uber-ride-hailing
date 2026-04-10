# Low Level Design (LLD)

## Overview

This document captures the concrete low-level design reflected by the current code in the repository, including the actual tables, Redis keys, event channels, and service internals.

## 1. Service-Level Internal Structure

Each service follows the same broad layout:

```text
routes -> controller -> service -> repository/config/broker
```

Typical folders in `src/`:

- `controllers/`
- `routes/`
- `services/`
- `repositories/`
- `brokers/`
- `consumers/`
- `config/`

## 2. Database Design

The checked-in bootstrap schema comes from [`docker/postgres/init.sql`](/Users/sumanthrockzz/new-projects/Uber%20Clone/docker/postgres/init.sql).

### Rides Table

```sql
CREATE TABLE IF NOT EXISTS rides (
  id SERIAL PRIMARY KEY,
  rider_id VARCHAR(50),
  pickup TEXT,
  destination TEXT,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Used by:

- Ride Service `createRide`
- Ride Service `getRideById`
- Ride Service `updateRideStatus`

### Trips Table

```sql
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  ride_id INT,
  driver_id VARCHAR(50),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_ride
ON trips (ride_id);
```

Used by:

- Trip Service `createTrip`
- Trip Service `getTripById`
- Trip Service `updateTrip`

Design note:

- `ON CONFLICT (ride_id) DO NOTHING` is used to make trip creation idempotent.

### Payments Table

```sql
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  trip_id INT,
  amount FLOAT,
  status VARCHAR(50),
  transaction_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Current mismatch:

- `PostgresPaymentRepository.createPayment()` inserts `trip_id`, `ride_id`, `amount`, `status`, and `payment_id`
- The bootstrap table shown above does not include `ride_id` or `payment_id`

That mismatch should be treated as an implementation gap in the current worktree.

## 3. Redis Design

Redis is used as a state store, lock manager, GEO index, and Pub/Sub broker.

### Driver GEO Index

Key:

```text
drivers:locations
```

Commands:

```text
GEOADD drivers:locations <lng> <lat> <driverId>
GEORADIUS drivers:locations <lng> <lat> <radius> km WITHDIST
```

Used by:

- Driver Service repository
- Matching Service via Driver Service HTTP call

### Ride State

Key pattern:

```text
ride:{rideId}
```

Expected values:

- `REQUESTED`
- `MATCHED`

Used by:

- Matching Service during acceptance validation
- Ride Service during ride creation

Current caveat:

- Ride creation sets `ride:${data.id}` instead of `ride:${ride.id}`, so the creation flow does not currently seed the intended key correctly.

### Acceptance Lock

Key pattern:

```text
ride_lock:{rideId}
```

Command:

```text
SET ride_lock:{rideId} {driverId} NX EX 30
```

Purpose:

- prevent two drivers from accepting the same ride at the same time

### Matching Idempotency

Key pattern:

```text
idem:{idempotencyKey}
```

Command:

```text
SET idem:{idempotencyKey} PROCESSING NX EX 300
```

Purpose:

- prevent duplicate acceptance processing

### Payment Idempotency

Key pattern:

```text
payment:{tripId}
```

States observed in code:

- `PROCESSING`
- JSON payload with success details

Purpose:

- prevent duplicate payment processing

## 4. Event Channels

The current implementation uses Redis Pub/Sub channels.

### Main Channels

- `ride.matched`
- `trip.completed`
- `payment.completed`
- `payment.failed`

### DLQ Channels

- `ride.matched.DLQ`
- `payment.completed.DLQ`
- `payment.failed.DLQ`

### Consumer Mapping

| Channel | Consumers |
| --- | --- |
| `ride.matched` | Ride Service, Trip Service, Notification Service |
| `trip.completed` | Payment Service, Notification Service |
| `payment.completed` | Ride Service, Notification Service |
| `payment.failed` | Ride Service, Notification Service |

## 5. API Route Implementation Map

### Ride Service

```text
POST  /api/rides
GET   /api/rides/:id
PATCH /api/rides/:id/status
GET   /health
```

### Driver Service

```text
POST /api/drivers/:id/location
GET  /api/drivers/nearby
GET  /health
```

### Matching Service

```text
POST /api/match
POST /api/match/accept
GET  /health
```

### Trip Service

```text
POST /api/trips
GET  /api/trips/:tripId
POST /api/trips/:tripId/complete
GET  /health
```

### Payment Service

Actual mounted path:

```text
GET /api/api/payments/:tripId
GET /health
```

Reason:

- route file contains `/api/payments/:tripId`
- service mounts that router under `/api`

### Notification Service

```text
GET /health
```

## 6. Detailed Service Logic

### Ride Service Logic

`RideService.updateRideStatus()` currently allows:

```text
REQUESTED
MATCHED
STARTED
COMPLETED
CANCELLED
```

Consumer behavior:

- `ride.matched` -> set ride to `MATCHED`
- `payment.completed` -> set ride to `COMPLETED`
- `payment.failed` -> attempts `PAYMENT_FAILED`

Important gap:

- `PAYMENT_FAILED` is not allowed by `updateRideStatus()`, so payment-failure handling currently routes to DLQ.

### Matching Service Logic

Acceptance algorithm in order:

1. create idempotency key
2. read ride state
3. acquire ride lock
4. write ride state `MATCHED`
5. publish `ride.matched`

### Trip Service Logic

Trip creation:

- inserts `STARTED` trip row
- ignores duplicates through the unique `ride_id` constraint

Trip completion:

- fetches trip by id
- calculates fare via `FareCalculator`
- updates trip status to `COMPLETED`
- publishes `trip.completed`

Observed implementation gap:

- completion code updates `fare`, `distance_km`, and `duration_min` style fields that are not present in the bootstrap `trips` schema

### Payment Service Logic

Processing flow:

1. acquire Redis payment lock
2. simulate delay
3. randomly mark payment success or failure
4. persist payment
5. publish payment result

Observed implementation gap:

- payment persistence expects columns not present in bootstrap schema

### Notification Service Logic

Notification consumer subscribes to:

- `ride.matched`
- `trip.started`
- `trip.completed`
- `payment.completed`
- `payment.failed`

Current behavior:

- simply logs payloads

Observed implementation gap:

- `src/index.js` requires `./brokers/RedisBroker`, while the repository file name is `redisBroker.js`

## 7. Retry And DLQ Design

Trip consumer retry schedule:

```text
Attempt 1 retry after 3s
Attempt 2 retry after 5s
Attempt 3 retry after 10s
Then publish to ride.matched.DLQ
```

Ride Service also subscribes directly to DLQ channels and retries the state update logic when those events arrive.

## 8. Summary

The current LLD is strong on core control-flow mechanics:

- Redis GEO lookup
- distributed locking
- idempotency
- retry and DLQ routing
- per-service layering

The main low-level issues are code-to-schema drift and a few wiring inconsistencies, but the underlying ride lifecycle design is already clear and easy to extend.
