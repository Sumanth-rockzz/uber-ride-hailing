# 🚀 API Documentation

## 📌 Base URLs

| Service          | Base URL              |
| ---------------- | --------------------- |
| Ride Service     | http://localhost:3001 |
| Driver Service   | http://localhost:3002 |
| Matching Service | http://localhost:3003 |
| Trip Service     | http://localhost:3004 |

---

# 🧭 1. Ride Service APIs

## ➤ Create Ride

**POST** `/api/rides`

### Request Body

```json
{
  "riderId": "user123",
  "pickup": "Bangalore",
  "destination": "Airport"
}
```

### Response

```json
{
  "id": 1,
  "rider_id": "user123",
  "pickup": "Bangalore",
  "destination": "Airport",
  "status": "REQUESTED",
  "created_at": "..."
}
```

---

## ➤ Get Ride

**GET** `/api/rides/:id`

### Response

```json
{
  "id": 1,
  "status": "MATCHED"
}
```

---

## ➤ Update Ride Status (Internal / Kafka Consumer)

**PATCH** `/api/rides/:id/status`

### Request Body

```json
{
  "status": "MATCHED"
}
```

---

# 🚗 2. Driver Service APIs

## ➤ Update Driver Location

**POST** `/api/drivers/:id/location`

### Request Body

```json
{
  "lat": 12.9716,
  "lng": 77.5946
}
```

### Response

```json
{
  "driverId": "driver1",
  "lat": 12.9716,
  "lng": 77.5946
}
```

---

## ➤ Find Nearby Drivers

**GET** `/api/drivers/nearby`

### Query Params

```text
lat=12.9716
lng=77.5946
radius=5
```

### Response

```json
[
  "driver1",
  "driver2",
  "driver3"
]
```

---

# 🧠 3. Matching Service APIs

## ➤ Match Drivers

**POST** `/api/match`

### Request Body

```json
{
  "rideId": 1,
  "pickupLat": 12.9716,
  "pickupLng": 77.5946
}
```

### Response

```json
{
  "rideId": 1,
  "drivers": ["driver1", "driver2", "driver3"]
}
```

---

## ➤ Accept Ride (Driver)

**POST** `/api/match/accept`

### Request Body

```json
{
  "rideId": 1,
  "driverId": "driver1",
  "idempotencyKey": "unique-key-123"
}
```

### Response

```json
{
  "success": true,
  "rideId": 1,
  "driverId": "driver1"
}
```

### Notes

* Uses Redis lock for concurrency
* Uses Redis state for ride validation
* Uses idempotency key to prevent duplicate processing
* Publishes Kafka event (`ride.matched`)

---

# 🧾 4. Trip Service APIs

## ➤ Create Trip (Internal via Kafka)

**POST** `/api/trips`

### Request Body

```json
{
  "rideId": 1,
  "driverId": "driver1"
}
```

### Response

```json
{
  "id": 1,
  "ride_id": 1,
  "driver_id": "driver1",
  "status": "STARTED",
  "created_at": "..."
}
```

---

# 🔁 Kafka Events

## ➤ Topic: `ride.matched`

### Payload

```json
{
  "rideId": 1,
  "driverId": "driver1",
  "retryCount": 0
}
```

---

## ➤ Topic: `ride.matched.DLQ`

### Payload

```json
{
  "rideId": 1,
  "driverId": "driver1",
  "retryCount": 3
}
```

---

# 🧠 Redis Keys Used

```text
drivers:locations         → GEO location storage
ride:{rideId}             → ride state (REQUESTED / MATCHED)
ride_lock:{rideId}        → distributed lock
idem:{idempotencyKey}     → idempotency control
```

---

# ⚡ Notes

* All services are independently deployable
* Communication is both:

  * Sync (HTTP)
  * Async (Kafka)
* Redis is used for real-time operations
* Postgres is used for persistence
* Kafka ensures decoupling and scalability
* New Relic APM integrated to monitor API latency, throughput, and performance bottlenecks across services.

---
