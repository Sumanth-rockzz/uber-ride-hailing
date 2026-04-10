# Repository Guidelines

## Project Structure & Module Organization
This repository is organized as independent Node.js microservices under `services/`: `ride-service`, `driver-service`, `matching-service`, `trip-service`, `payment-service`, and `notification-service`. Each service keeps runtime code in `src/` with a consistent split across `controllers/`, `routes/`, `services/`, `repositories/`, `brokers/`, `consumers/`, `config/`, and `index.js`. Infrastructure lives in [`docker-compose.yml`](/Users/sumanthrockzz/new-projects/Uber%20Clone/docker-compose.yml) and [`docker/postgres/init.sql`](/Users/sumanthrockzz/new-projects/Uber%20Clone/docker/postgres/init.sql). Architecture and API notes are in `docs/`.

## Build, Test, and Development Commands
Run commands from the relevant service directory unless noted otherwise.

- `npm install`: install a service’s dependencies.
- `npm run dev`: start a service with `nodemon`.
- `npm start`: run the service with Node.js.
- `docker compose up --build`: build and run the full local stack with Redis and Postgres.

Example: `cd services/ride-service && npm run dev`

## Coding Style & Naming Conventions
The codebase uses CommonJS (`require`, `module.exports`) and mostly 2-space indentation. Keep file names aligned to role-based patterns such as `rideController.js`, `tripService.js`, and `postgresPaymentRepository.js`. Use `camelCase` for variables and methods, `PascalCase` for classes, and keep route registration in `routes/` while business logic stays in `services/`. There is no configured ESLint or Prettier yet, so keep formatting consistent with nearby files and avoid unrelated style-only edits.

## Testing Guidelines
There is no automated test suite configured today. For new work, add focused tests near the affected service when introducing a framework, and at minimum verify the change with local service startup and `/health` checks. Prefer test names that mirror the module under test, for example `rideService.test.js` or `paymentController.spec.js`.

## Commit & Pull Request Guidelines
Recent commits use short, imperative summaries such as `added Notification service.` and `dockerized all services...`. Prefer clear subject lines that describe the change directly, ideally scoped by service, for example `trip-service: publish trip.completed after fare calculation`. Pull requests should include a concise description, impacted services, any environment or schema changes, linked issues, and API screenshots or sample payloads when endpoints change.

## Security & Configuration Tips
Keep secrets in environment variables and never commit `.env` files. Treat New Relic config and broker/database settings as deployment-specific. When changing ports, topics, or Redis/Postgres settings, update both the service config and `docker-compose.yml`.
