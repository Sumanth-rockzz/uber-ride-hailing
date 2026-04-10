
  # Plan: Uber-Grade Phased Architecture Sheet for Core Real-
  Time Systems

  ## Summary

  Create a new Markdown planning document in docs/ that is
  separate from the current generic HLD docs and focused only
  on these four systems:

  - Update Driver Location
  - Driver Matching System
  - Real-Time Location Tracking
  - Notification System

  The document should be written as an Uber-grade phased build
  plan, but still mapped to this repository’s current
  microservice setup. It should read like a future
  implementation blueprint, not current-state documentation.

  Default target file: docs/UBER_REALTIME_PHASE_PLAN.md

  ## Key Changes

  ### Document intent and tone

  - Write for engineering planning, not interview explanation.
  - Describe target-state architecture first, then phased
    rollout from current repo state.
  - Keep it high signal and implementation-oriented, but still
    readable for product and engineering discussions.

  ### Document structure

  The sheet should include these sections in order:

  1. Title + Objective
      - State that this is the phased high-level plan to make
        the platform behave closer to Uber for real-time
        dispatch and rider-driver communication.
  2. Current State vs Target State
      - Briefly summarize what the repo does today.
      - Explicitly call out current limitations:
          - Redis Pub/Sub instead of durable event streaming
          - basic driver location updates only
          - simple nearby-driver matching
          - no live rider-driver tracking experience
          - notification service is placeholder/log-only
  3. System 1: Update Driver Location
      - Goal: high-frequency, low-latency driver telemetry
        ingestion
      - Inputs: driver id, lat/lng, heading, speed, accuracy,
        timestamp, trip/availability status
      - Core design:
          - driver app sends location at variable intervals
          - driver-service validates and ingests updates
          - Redis stores hot location
          - durable store keeps sampled or batched history
      - Key concerns:
          - throttling and deduplication
          - stale location expiry
          - battery/network optimization
          - GPS jitter filtering
      - Phase breakdown:
          - Phase 1: current Redis GEO approach
          - Phase 2: richer payload + TTL + status-aware
            updates
          - Phase 3: stream processing, batching, regional
            partitioning
  4. System 2: Driver Matching System
      - Goal: assign the best available driver quickly and
        safely
      - Core design:
          - candidate retrieval by geo radius
          - filtering by availability, vehicle type, surge
            zone, trip state
          - scoring by ETA, distance, acceptance rate,
            cancellation rate, rating, driver idle time
          - dispatch to top-N candidates in waves
          - lock/idempotency during acceptance
      - Explain matching lifecycle:
          - ride request created
          - candidate pool built
          - ranked shortlist generated
          - offer sent
          - driver accepts
          - lock acquired
          - assignment finalized
          - downstream ride/trip events published
      - Phase breakdown:
          - Phase 1: nearest-driver matching
          - Phase 2: score-based ranking + retry waves
          - Phase 3: ETA models, zone balancing, marketplace
            optimization
  5. System 3: Real-Time Location Tracking
      - Goal: live rider experience after assignment
      - Cover three real-time views:
          - driver available before assignment
          - driver approaching pickup
          - trip in progress
      - Core design:
          - driver location updates fan out to tracking
            channels
          - rider app subscribes to trip-specific updates
          - location stream frequency changes by ride state
          - fallback polling exists if stream is interrupted
      - Include architecture choices:
          - WebSockets or SSE for rider/driver live tracking
          - Redis/Kafka/event bus behind stream fan-out
          - trip-scoped channels like trip:{tripId}:location
      - Phase breakdown:
          - Phase 1: polling or short-interval refresh
          - Phase 2: WebSocket trip tracking
          - Phase 3: optimized fan-out, map snapping, ETA
            recalculation
  6. System 4: Notification System
      - Goal: reliable rider and driver communication for
        dispatch and trip milestones
      - Cover notification categories:
          - new ride request to driver
          - ride assigned to rider
          - driver arrived
          - trip started/completed
          - payment success/failure
          - missed/expired dispatch requests
      - Design:
          - notification-service becomes real orchestrator, not
            logger
          - channel routing by event type and user preference
          - push first, SMS fallback for critical flows
          - retry and delivery tracking
      - Phase breakdown:
          - Phase 1: event consumption + structured
            notification records
          - Phase 2: push notifications
          - Phase 3: SMS/email fallback + delivery analytics +
            template versioning
  7. Cross-Cutting Architecture
      - Explain how these four systems interact together.
      - Include one end-to-end flow:
          - driver location update
          - candidate matching
          - assignment
          - rider live tracking
          - notifications during trip lifecycle
      - Include supporting concerns:
          - idempotency
          - distributed locking
          - stale-driver eviction
          - event durability
          - observability
          - DLQ/retry handling
          - auth between services and clients
  8. Phase-by-Phase Build Roadmap
      - Add a dedicated section with implementation phases
        across all four systems:
          - Phase 1: stabilize current repo
          - Phase 2: Uber-like dispatch and tracking basics
          - Phase 3: production-grade reliability and scale
      - For each phase list:
          - goals
          - services impacted
          - expected deliverables
          - what is intentionally deferred
  9. Service Impact Map
      - Map expected ownership by service:
          - driver-service: telemetry ingest, availability, hot
            geo state
          - matching-service: ranking, offer orchestration,
            assignment lock flow
          - ride-service: ride state transitions and rider-
            facing state
          - trip-service: trip lifecycle and tracking state
          - notification-service: delivery orchestration
          - auth-service: secure rider/driver tokens for app
            and internal flows
      - Mention where new infrastructure may be introduced:
          - WebSocket gateway
          - Kafka or durable event bus
          - notification provider integration
  10. Success Metrics

  - Include concrete metrics to make the plan interview- and
    implementation-ready:
      - driver location freshness
      - dispatch latency
      - match success rate
      - ETA accuracy
      - notification delivery rate
      - real-time tracking latency
      - duplicate assignment rate

  ## Public Interfaces / Architecture Additions

  The planning sheet should explicitly introduce the future
  interfaces that do not exist cleanly today:

  - richer driver location payload beyond simple lat/lng
  - trip-specific real-time tracking channel or websocket
    contract
  - driver dispatch offer lifecycle states
  - notification event contract with channel and delivery
    status
  - internal durable events replacing or augmenting Redis Pub/
    Sub
  - optional WebSocket gateway or realtime edge service

  These should be described at a high level only. Do not over-
  specify request schemas or implementation code details in
  this first planning doc.

  ## Test / Validation Scenarios To Include In The Sheet

  The sheet should define acceptance scenarios for each system:

  - Driver goes online and location becomes queryable within
    target freshness window.
  - Nearby drivers are filtered correctly and top candidates
    are ranked deterministically.
  - Two drivers accepting the same ride results in exactly one
    assignment.
  - Rider sees driver movement after assignment with bounded
    tracking latency.
  - Notifications are sent for assignment, arrival, trip start,
    trip completion, and payment outcomes.
  - Stale drivers stop appearing in matching results.
  - Temporary notification failure triggers retry/fallback
    behavior.
  - Real-time channel disruption falls back safely without
    breaking trip state.

  ## Assumptions and Defaults

  - Planning depth: Uber-grade target architecture, not MVP-
    only.
  - Output location: new standalone file under docs/.
    rather than redesign the whole repo from scratch.
    as a focused roadmap for the real-time core.