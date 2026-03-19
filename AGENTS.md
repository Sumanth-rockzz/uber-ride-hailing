# Repository Guidelines

## Project Structure & Module Organization
This repository is organized as a small service-based backend. The active code lives under `services/ride-service/`, with the HTTP entry point at `services/ride-service/src/index.js` and PostgreSQL setup in `services/ride-service/src/config/db.js`. Database migrations belong in `services/ride-service/migrations/`. Other service folders such as `services/driver-service/`, `services/trip-service/`, and `shared/` exist as placeholders and should follow the same layout when implemented. Infrastructure for local dependencies is defined in `docker-compose.yml`.

## Build, Test, and Development Commands
Run commands from the repository root unless noted.

- `docker compose up -d`: starts local PostgreSQL on `localhost:5433` and Redis on `localhost:6379`.
- `cd services/ride-service && npm install`: installs service dependencies.
- `cd services/ride-service && npm start`: runs the ride service on port `3001`.
- `curl http://localhost:3001/health`: quick health check.
- `curl http://localhost:3001/db-test`: verifies database connectivity.

There is no build step yet; this service currently runs directly with Node.js.

## Coding Style & Naming Conventions
Use CommonJS modules to match the current codebase. Prefer 2-space indentation, single quotes, and semicolons, consistent with `src/index.js`. Use lowercase hyphenated names for service directories (`ride-service`) and short, descriptive filenames (`db.js`, `index.js`). Keep route handlers thin and move shared setup into `src/config/` or future `src/lib/` modules. No formatter or linter is configured yet, so keep style changes minimal and consistent.

## Testing Guidelines
Automated tests are not set up yet. Add tests alongside new features instead of extending the placeholder `npm test` script. If you introduce a test runner, prefer a clear pattern such as `*.test.js` under `services/<service>/src/` or a dedicated `services/<service>/tests/` directory. At minimum, validate `/health`, database access paths, and failure handling before opening a PR.

## Commit & Pull Request Guidelines
Git history currently contains only `Initial commit`, so follow simple imperative commit messages such as `Add ride status endpoint` or `Configure postgres pool`. Keep commits scoped to one service or concern. PRs should include a short summary, local verification steps, any required environment variables or ports, and sample request/response output for API changes.

## Security & Configuration Tips
Do not hardcode credentials in new code. Move connection settings to environment variables via `dotenv`, and document required keys in the service README or PR description. Avoid committing `node_modules/` or secrets.
