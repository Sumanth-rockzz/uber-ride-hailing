# System Flows

## Overview

This document describes the main runtime flows implemented in the current codebase. The active async mechanism is Redis Pub/Sub, not Kafka.

## 1. Ride Creation Flow

```text
Client -> Ride Service -> Postgres
```

Steps:

1. Client calls `POST /api/rides`.
2. Ride Service validates the request body at controller level only by shape usage.
3. `PostgresRideRepository` inserts a row into `rides` with status `REQUESTED`.
4. Ride Service returns the inserted ride row.
5. Ride Service also attempts to set Redis key `ride:{data.id}` to `REQUESTED`.

Important note:

- The service currently uses `data.id` instead of the inserted ride id, so the intended Redis ride-state key is not being written correctly during creation.

## 2. Driver Location Update Flow

```text
Driver -> Driver Service -> Redis GEO
```

Steps:

1. Driver calls `POST /api/drivers/:id/location` with `lat` and `lng`.
2. Driver Service writes the coordinate to Redis GEO set `drivers:locations`.
3. Service returns `{ driverId, lat, lng }`.

Redis command shape:

```text
GEOADD drivers:locations <lng> <lat> <driverId>
```

## 3. Nearby Driver Lookup Flow

```text
Matching Service -> Driver Service -> Redis GEO
```

Steps:

1. Matching flow calls Driver Service `GET /api/drivers/nearby`.
2. Driver Service runs a `GEORADIUS` lookup against `drivers:locations`.
3. Redis returns driver ids with distance.
4. Matching Service keeps the top 5 entries and returns them.

## 4. Ride Matching Flow

```text
Client -> Matching Service -> Driver Service
```

Steps:

1. Client calls `POST /api/match` with `rideId`, `pickupLat`, and `pickupLng`.
2. Matching Service requests nearby drivers from Driver Service.
3. If no drivers are returned, Matching Service responds with `404`.
4. If drivers are available, Matching Service returns:

```json
{
  "rideId": 1,
  "drivers": [
    ["driver1", "0.5312"],
    ["driver2", "1.8821"]
  ]
}
```

This endpoint does not persist a match. It only produces candidate drivers.

## 5. Driver Acceptance Flow

This is the main concurrency-sensitive path in the repository.

```text
Driver -> Matching Service -> Redis -> Pub/Sub
```

Steps:

1. Driver calls `POST /api/match/accept` with `rideId`, `driverId`, and `idempotencyKey`.
2. Matching Service attempts to create `idem:{idempotencyKey}` with `SET NX EX 300`.
3. If the key already exists, the service treats the request as already processed.
4. Matching Service reads `ride:{rideId}`.
5. If the ride is already `MATCHED`, the request is rejected.
6. Matching Service acquires `ride_lock:{rideId}` with `SET NX EX 30`.
7. If the lock cannot be acquired, the request is rejected.
8. Matching Service sets `ride:{rideId}` to `MATCHED`.
9. Matching Service publishes `ride.matched`.
10. Matching Service returns success to the caller.

Published payload:

```json
{
  "rideId": 1,
  "driverId": "driver1",
  "retryCount": 0
}
```

## 6. Ride Matched Event Processing

### Ride Service Consumer

```text
ride.matched -> Ride Service
```

Steps:

1. Ride Service subscribes to `ride.matched`.
2. On receipt, it updates the Postgres ride row to status `MATCHED`.
3. If processing fails, `subscribeWithDLQ` republishes the event to `ride.matched.DLQ`.

### Trip Service Consumer

```text
ride.matched -> Trip Service
```

Steps:

1. Trip Service subscribes to `ride.matched`.
2. It attempts to create a trip row with status `STARTED`.
3. If insert fails:
4. Duplicate trip conflicts are ignored.
5. Other failures are retried after `3s`, `5s`, and `10s`.
6. After 3 retries, the event is published to `ride.matched.DLQ`.

## 7. Trip Completion Flow

```text
Client -> Trip Service -> Postgres -> Pub/Sub
```

Steps:

1. Client calls `POST /api/trips/:tripId/complete`.
2. Trip Service loads the trip by id.
3. Trip Service calculates fare using:
   - `distance_km || 5`
   - `duration_min || 15`
   - `tier || "STANDARD"`
4. Trip row is updated to status `COMPLETED` and fare is written.
5. Trip Service publishes `trip.completed`.

Published payload:

```json
{
  "tripId": 10,
  "rideId": 1,
  "driverId": "driver1",
  "amount": 250
}
```

Important note:

- The event currently uses `trip.fare || 250`, even though fare is calculated during completion. That means the published amount may not always reflect the freshly updated value.

## 8. Payment Processing Flow

```text
trip.completed -> Payment Service -> Redis -> Postgres -> Pub/Sub
```

Steps:

1. Payment Service subscribes to `trip.completed`.
2. It attempts Redis lock `payment:{tripId}` using `SET NX EX 300`.
3. If the lock already exists, processing is skipped.
4. Service simulates payment processing with a short delay.
5. Success path:
   - stores success metadata in Redis
   - inserts payment row in Postgres
   - publishes `payment.completed`
6. Failure path:
   - deletes the Redis lock
   - inserts failed payment row
   - publishes `payment.failed`

## 9. Ride Finalization Flow

```text
payment.completed/payment.failed -> Ride Service
```

Steps:

1. Ride Service listens for payment result events.
2. On `payment.completed`, it updates the ride status to `COMPLETED`.
3. On `payment.failed`, it attempts to update the ride status to `PAYMENT_FAILED`.

Important note:

- `RideService.updateRideStatus` only allows `REQUESTED`, `MATCHED`, `STARTED`, `COMPLETED`, and `CANCELLED`.
- Because of that, `payment.failed` processing currently throws for `PAYMENT_FAILED` and falls into the DLQ path.

## 10. Notification Flow

```text
ride.matched / trip.started / trip.completed / payment.* -> Notification Service
```

Steps:

1. Notification Service subscribes to a predefined event list.
2. For each received event, it logs a notification payload.
3. There is no external SMS, email, or push provider integration yet.

Important note:

- `trip.started` is subscribed but is not currently published by the checked-in services.

## 11. DLQ Flow

DLQ handling currently exists on Redis Pub/Sub channels rather than a persistent queue.

Channels in use:

- `ride.matched.DLQ`
- `payment.completed.DLQ`
- `payment.failed.DLQ`

Current behavior:

- Ride Service subscribes to these DLQ channels and retries status updates directly.
- Trip Service publishes to `ride.matched.DLQ` after retry exhaustion.
- Because Redis Pub/Sub is ephemeral, DLQ messages are not durable across subscriber downtime.
