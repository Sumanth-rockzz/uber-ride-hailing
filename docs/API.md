# API Documentation

## Overview

This document describes the HTTP surface currently present in the working tree. The system is split into six Node.js services:

- Ride Service on port `3001`
- Driver Service on port `3002`
- Matching Service on port `3003`
- Trip Service on port `3004`
- Payment Service on port `3005`
- Notification Service on port `3006`

Most routes are mounted under `/api`. Health checks are exposed separately by each service.

## Base URLs

| Service | Base URL |
| --- | --- |
| Ride Service | `http://localhost:3001` |
| Driver Service | `http://localhost:3002` |
| Matching Service | `http://localhost:3003` |
| Trip Service | `http://localhost:3004` |
| Payment Service | `http://localhost:3005` |
| Notification Service | `http://localhost:3006` |

## Ride Service

### Health Check

```http
GET /health
```

Response:

```text
Ride Service Running
```

### Create Ride

```http
POST /api/rides
Content-Type: application/json
```

Request body:

```json
{
  "riderId": "user123",
  "pickup": "Bangalore",
  "destination": "Airport"
}
```

Current behavior:

- Stores a row in Postgres with status `REQUESTED`
- Returns the inserted ride record

Example response:

```json
{
  "id": 1,
  "rider_id": "user123",
  "pickup": "Bangalore",
  "destination": "Airport",
  "status": "REQUESTED",
  "created_at": "2026-04-06T10:00:00.000Z"
}
```

### Get Ride

```http
GET /api/rides/:id
```

Example response:

```json
{
  "id": 1,
  "rider_id": "user123",
  "pickup": "Bangalore",
  "destination": "Airport",
  "status": "MATCHED",
  "created_at": "2026-04-06T10:00:00.000Z"
}
```

Possible errors:

- `404` if the ride does not exist

### Update Ride Status

```http
PATCH /api/rides/:id/status
Content-Type: application/json
```

Request body:

```json
{
  "status": "MATCHED"
}
```

Allowed statuses in current service code:

- `REQUESTED`
- `MATCHED`
- `STARTED`
- `COMPLETED`
- `CANCELLED`

Possible errors:

- `400` when `status` is missing
- `500` when the status is outside the allowed set

## Driver Service

### Health Check

```http
GET /health
```

Response:

```text
Driver Service Running
```

### Update Driver Location

```http
POST /api/drivers/:id/location
Content-Type: application/json
```

Request body:

```json
{
  "lat": 12.9716,
  "lng": 77.5946
}
```

Current behavior:

- Writes the location into Redis GEO set `drivers:locations`
- Returns the written coordinates

Example response:

```json
{
  "driverId": "driver1",
  "lat": 12.9716,
  "lng": 77.5946
}
```

### Find Nearby Drivers

```http
GET /api/drivers/nearby?lat=12.9716&lng=77.5946&radius=5
```

Current behavior:

- Reads from Redis using `GEORADIUS`
- Returns the raw Redis response with distance data

Example response:

```json
[
  ["driver1", "0.5312"],
  ["driver2", "1.8821"]
]
```

## Matching Service

### Health Check

```http
GET /health
```

Response:

```text
Matching Service is running
```

### Match Drivers For Ride

```http
POST /api/match
Content-Type: application/json
```

Request body:

```json
{
  "rideId": 1,
  "pickupLat": 12.9716,
  "pickupLng": 77.5946
}
```

Current behavior:

- Calls Driver Service `/api/drivers/nearby`
- Returns up to 5 nearby drivers

Example response:

```json
{
  "rideId": 1,
  "drivers": [
    ["driver1", "0.5312"],
    ["driver2", "1.8821"]
  ]
}
```

Possible errors:

- `404` if no drivers are available

### Accept Ride

```http
POST /api/match/accept
Content-Type: application/json
```

Request body:

```json
{
  "rideId": 1,
  "driverId": "driver1",
  "idempotencyKey": "accept-ride-1-driver1"
}
```

Current behavior:

- Uses Redis idempotency key `idem:{idempotencyKey}`
- Uses Redis lock `ride_lock:{rideId}`
- Checks `ride:{rideId}` before assigning
- Publishes `ride.matched` through Redis Pub/Sub

Example success response:

```json
{
  "success": true,
  "rideId": 1,
  "driverId": "driver1"
}
```

Example already-taken response body:

```json
{
  "message": "Ride already taken"
}
```

## Trip Service

### Health Check

```http
GET /health
```

Response:

```text
Trip Service is running
```

### Create Trip

```http
POST /api/trips
Content-Type: application/json
```

Request body:

```json
{
  "rideId": 1,
  "driverId": "driver1"
}
```

Current behavior:

- Inserts a trip row with status `STARTED`
- Uses `ON CONFLICT (ride_id) DO NOTHING`

### Get Trip

```http
GET /api/trips/:tripId
```

### Complete Trip

```http
POST /api/trips/:tripId/complete
```

Current behavior:

- Calculates fare using fallback defaults when trip metrics are absent
- Updates trip status to `COMPLETED`
- Publishes `trip.completed`

## Payment Service

### Health Check

```http
GET /health
```

Response:

```text
Payment Service is running
```

### Get Payment By Trip

Current mounted route in this codebase:

```http
GET /api/api/payments/:tripId
```

Note:

- `paymentRoutes` already includes `/api/payments/:tripId`
- `index.js` mounts the router again under `/api`
- The effective path is therefore `/api/api/payments/:tripId` in the current implementation

Example response:

```json
{
  "id": 1,
  "trip_id": 10,
  "amount": 250,
  "status": "SUCCESS",
  "transaction_id": "pay_1712400000000",
  "created_at": "2026-04-06T10:00:00.000Z"
}
```

## Notification Service

### Health Check

```http
GET /health
```

Response:

```text
Notification Service is running
```

### Public API

There are no public business endpoints in the current notification service. It only exposes `/health` and consumes internal events.

## Internal Events

The running implementation currently uses Redis Pub/Sub as the active broker. Kafka scaffolding exists in the repository, but the main service startup paths use Redis brokers today.

Published events currently used by the code:

- `ride.matched`
- `ride.matched.DLQ`
- `trip.completed`
- `payment.completed`
- `payment.failed`
- `payment.completed.DLQ`
- `payment.failed.DLQ`
