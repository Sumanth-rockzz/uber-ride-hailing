# 🔄 System Flow Documentation

## 📌 Overview

This document describes the key flows in the ride-hailing system:

1. Ride Request Flow
2. Driver Location Flow
3. Matching Flow
4. Driver Acceptance Flow
5. Event Processing Flow (Kafka)

---

# 🚗 1. Ride Request Flow

```text
Client → Ride Service → Postgres → Redis
```

### Steps:

1. Rider sends request:

```http
POST /api/rides
```

2. Ride Service:

   * Stores ride in Postgres
   * Initializes ride state in Redis:

     ```text
     ride:{rideId} = REQUESTED
     ```

3. Response returned to client

---

# 📍 2. Driver Location Flow

```text
Driver → Driver Service → Redis (GEO)
```

### Steps:

1. Driver updates location:

```http
POST /api/drivers/:id/location
```

2. Driver Service:

   * Stores location using Redis GEO:

     ```text
     GEOADD drivers:locations lng lat driverId
     ```

3. This enables fast nearby driver lookup

---

# 🧠 3. Matching Flow

```text
Matching Service → Driver Service → Redis
```

### Steps:

1. Matching request:

```http
POST /api/match
```

2. Matching Service:

   * Calls Driver Service:

     ```http
     GET /api/drivers/nearby
     ```
   * Retrieves nearby drivers using Redis GEO
   * Selects top N drivers (e.g., 3)

3. Returns driver list

---

# ⚡ 4. Driver Acceptance Flow (Critical Flow)

```text
Driver → Matching Service → Redis → Kafka
```

### Steps:

1. Driver sends accept request:

```http
POST /api/match/accept
```

2. Matching Service executes:

---

### 🔹 Step 1: Idempotency Check

```text
SET idem:{key} NX
```

* Prevents duplicate processing

---

### 🔹 Step 2: Distributed Lock

```text
SET ride_lock:{rideId} NX EX 30
```

* Ensures only one driver can accept

---

### 🔹 Step 3: Ride State Validation

```text
GET ride:{rideId}
```

* If already MATCHED → reject

---

### 🔹 Step 4: Update Ride State

```text
SET ride:{rideId} MATCHED
```

---

### 🔹 Step 5: Publish Event

```text
Kafka → ride.matched
```

---

# 📨 5. Event Processing Flow (Kafka)

```text
Matching Service → Kafka → Ride Service + Trip Service
```

---

## ➤ Ride Service Consumer

### Steps:

1. Consumes `ride.matched`
2. Updates Postgres:

```sql
UPDATE rides SET status = 'MATCHED'
```

---

## ➤ Trip Service Consumer

### Steps:

1. Consumes `ride.matched`
2. Creates trip:

```sql
INSERT INTO trips (...)
```

---

# 🔁 6. Retry + DLQ Flow

```text
Consumer → Failure → Retry → DLQ
```

### Steps:

1. If trip creation fails:

   * Retry with exponential backoff:

     ```text
     3s → 5s → 10s
     ```

2. Retry count tracked in message:

```json
{
  "retryCount": 2
}
```

3. If retry exceeds limit:

```text
Send to Kafka topic: ride.matched.DLQ
```

---

# 🧠 7. Idempotency Flow

```text
Duplicate Request → Redis → Ignore
```

### Steps:

1. Request contains:

```json
"idempotencyKey": "abc123"
```

2. Matching Service:

```text
SET idem:{key} NX
```

3. If key exists:

* Request ignored
* Prevents duplicate processing

---

# ⚡ End-to-End Flow Summary

```text
1. Rider creates ride
2. Driver updates location
3. Matching service finds drivers
4. Driver accepts ride
5. Redis ensures:
    - single assignment
    - no duplicates
6. Kafka event published
7. Ride updated
8. Trip created
```

---

# 🏆 Key Takeaways

* Redis handles real-time decisions
* Kafka handles asynchronous processing
* Postgres ensures durability
* System is eventually consistent

---

# ⚡ One Line Summary

> Real-time decisions happen in Redis, persistence happens in Postgres, and communication happens via Kafka

---
