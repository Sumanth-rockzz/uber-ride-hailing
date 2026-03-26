# 🔧 Low Level Design (LLD)

## 📌 Overview

This document describes the internal design of the ride-hailing backend system, including:

* Database schema
* Redis key design
* Kafka topics and message structure
* Service-level logic
* Idempotency and concurrency handling

---

# 🗄️ 1. Database Design (Postgres)

---

## 🚗 Rides Table

```sql
CREATE TABLE rides (
  id SERIAL PRIMARY KEY,
  rider_id VARCHAR(50),
  pickup TEXT,
  destination TEXT,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Status Values:

```text
REQUESTED
MATCHED
STARTED
COMPLETED
CANCELLED
```

---

## 🧾 Trips Table

```sql
CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  ride_id INT UNIQUE,
  driver_id VARCHAR(50),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Constraint:

```text
UNIQUE(ride_id)
```

* Prevents duplicate trip creation (idempotency at DB level)

---

# 🧠 2. Redis Design

Redis is used for real-time operations.

---

## 🔑 Key Patterns

| Key                | Purpose                              |
| ------------------ | ------------------------------------ |
| drivers:locations  | GEO index for driver locations       |
| ride:{rideId}      | Ride state (REQUESTED / MATCHED)     |
| ride_lock:{rideId} | Distributed lock for ride assignment |
| idem:{key}         | Idempotency key                      |

---

## 📍 Driver Location (GEO)

```text
GEOADD drivers:locations lng lat driverId
GEORADIUS drivers:locations lng lat radius km
```

---

## 🔒 Distributed Lock

```text
SET ride_lock:{rideId} driverId NX EX 30
```

* NX → only if not exists
* EX → expiry (prevents deadlock)

---

## 🔁 Idempotency

```text
SET idem:{key} NX EX 300
```

* Prevents duplicate request execution

---

## 🚦 Ride State

```text
ride:{rideId} = REQUESTED | MATCHED
```

* Used for fast validation in matching service

---

# 📨 3. Kafka Design

---

## 🔹 Topics

| Topic            | Purpose                     |
| ---------------- | --------------------------- |
| ride.matched     | Driver assigned to ride     |
| ride.matched.DLQ | Failed events after retries |

---

## 📦 Message Structure

### ride.matched

```json
{
  "rideId": 1,
  "driverId": "driver1",
  "retryCount": 0
}
```

---

## 🔁 Retry Strategy

* Retry up to 3 times
* Exponential backoff:

```text
3s → 5s → 10s
```

---

## 🚨 DLQ Strategy

* After max retries → publish to:

```text
ride.matched.DLQ
```

---

# 🧠 4. Service-Level Design

---

## 🚗 Ride Service

### Responsibilities:

* Create ride
* Fetch ride
* Update ride status (via Kafka)

### Flow:

```text
HTTP → Controller → Service → Repository → Postgres
Kafka → Consumer → Service → Repository → Postgres
```

---

## 📍 Driver Service

### Responsibilities:

* Update driver location
* Find nearby drivers

### Flow:

```text
HTTP → Controller → Service → Repository → Redis
```

---

## 🧠 Matching Service

### Responsibilities:

* Find drivers
* Handle driver acceptance
* Enforce concurrency and idempotency
* Publish Kafka events

---

### 🔥 Accept Driver Flow (Detailed)

```text
1. Idempotency check (Redis)
2. Distributed lock (Redis)
3. Ride state validation (Redis)
4. Update ride state (Redis)
5. Publish Kafka event
```

---

## 🧾 Trip Service

### Responsibilities:

* Create trip (via Kafka consumer)

### Flow:

```text
Kafka → Consumer → Service → Repository → Postgres
```

---

# ⚙️ 5. Idempotency Design

---

## Request-Level Idempotency

```text
Client sends idempotencyKey
```

---

## Handling:

```text
SET idem:{key} NX
```

* If exists → ignore request
* Prevents duplicate execution

---

# 🔒 6. Concurrency Design

---

## Problem:

Multiple drivers accept same ride

---

## Solution:

```text
SET ride_lock:{rideId} NX EX 30
```

---

## Behavior:

| Scenario      | Result   |
| ------------- | -------- |
| First driver  | Success  |
| Second driver | Rejected |

---

# 🔁 7. Failure Handling

---

## Retry Mechanism

* Consumer retries on failure
* Controlled via retryCount

---

## Backoff Strategy

```text
Retry delays: 3s → 5s → 10s
```

---

## DLQ Handling

* Failed events sent to DLQ
* Can be monitored or manually processed

---

# ⚡ 8. Performance Considerations

---

## Hot Path (Real-Time)

* Redis used for:

  * driver lookup
  * locking
  * state

---

## Cold Path (Persistence)

* Postgres used for:

  * rides
  * trips

---

## Async Processing

* Kafka decouples services
* Enables high throughput

---

# 🧠 9. Design Principles

```text
- Loose coupling
- High cohesion
- Eventual consistency
- Fail-safe design
- Scalability first
```

---

# 🏆 Summary

This system uses:

* Redis → real-time decisions
* Kafka → asynchronous communication
* Postgres → durable storage

It is designed to handle:

* high concurrency
* distributed coordination
* fault tolerance
* scalable ride matching

---
