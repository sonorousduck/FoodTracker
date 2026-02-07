# FoodTracker Deployment Plan

This document is the deployment runbook for moving the backend to another computer and serving:
- Mobile app (App Store builds)
- Web app (hosted website)

Current user decision:
- Use `food.sonorousduck.com` for both web and API, separated by port.
- Web served on port `7775`.
- API served on port `7774`.
- Database: self-hosted MySQL on deployment machine.
- Reverse proxy: Nginx.
- Service manager: systemd.

## Phase 1: Target Architecture (Start Here)

Decide and lock these items before provisioning:

1. Host topology
- Backend runs on the new computer.
- Frontend web can run on the same computer or separate hosting.

2. Domain + routing
- Current choice: same hostname `food.sonorousduck.com` with different ports.
- Example pattern:
  - Web: `https://food.sonorousduck.com` (port 443)
  - API: `https://food.sonorousduck.com:8443` (or another TLS port)

3. Database location
- Recommended: managed PostgreSQL for reliability and backups.
- Alternative: DB on the same computer as backend.

4. Reverse proxy and TLS
- Recommended: Caddy or Nginx in front of backend.
- TLS is required for App Store production traffic.

5. Process/runtime
- Backend: NestJS production build (`yarn build` + `yarn start:prod`).
- Service manager: `systemd` or `pm2` with auto-restart on boot.

### Phase 1 Recommendations

If you want lowest operational risk for production:

1. Use separate hostnames instead of custom API ports:
- Web: `food.sonorousduck.com`
- API: `api.food.sonorousduck.com`
- Reason: easier SSL, fewer firewall/client edge cases, cleaner CORS.

2. Keep API on 443 behind reverse proxy, not a custom external port.

3. Use managed PostgreSQL with automated daily backups.

### Phase 1 Decision Checklist

Mark each item as selected before continuing:

- [x] Shared hostname for web + API (`food.sonorousduck.com`)
- [x] API custom port selected: `7774`
- [x] Web custom port selected: `7775`
- [x] Database hosting: self-hosted MySQL on same host
- [x] Reverse proxy: Nginx
- [x] Service manager: `systemd`
- [x] Web hosting location: same server as backend

### Phase 1 Finalized Architecture

1. Domain and public entrypoints
- Domain: `food.sonorousduck.com`
- Web URL: `https://food.sonorousduck.com:7775`
- API URL: `https://food.sonorousduck.com:7774`

2. Runtime layout
- Same deployment computer hosts:
  - Frontend web server/process
  - Backend NestJS API process
  - MySQL database
- Nginx terminates TLS and proxies to internal service ports.
- `systemd` manages backend (and optionally web process if needed).

3. Suggested internal port mapping (behind Nginx)
- Nginx listen/public:
  - `7775` -> web upstream
  - `7774` -> API upstream
- Internal app examples:
  - Web app process on `127.0.0.1:3000`
  - Backend app on `127.0.0.1:3001`
  - MySQL on `127.0.0.1:3306`

4. DNS and firewall requirements
- DNS `A`/`AAAA` record:
  - `food.sonorousduck.com` -> deployment server public IP
- Firewall:
  - Allow inbound `7775/tcp` and `7774/tcp`
  - Block direct external access to internal app ports and MySQL (`3306`)

5. Environment URL values to use
- Frontend production API base URL:
  - `https://food.sonorousduck.com:7774`
- Backend CORS allowlist should include:
  - `https://food.sonorousduck.com:7775`

## Phase 2: Prepare Backend for Production

1. Create production environment variables (`.env.production` or host secret store):
- `NODE_ENV=production`
- `PORT=<internal app port>`
- `DATABASE_URL` (or DB host/user/password/name)
- `JWT_SECRET` and any auth secrets
- `CORS_ORIGINS` (production web origin, and any required app origins)
- `API_BASE_URL`

2. Confirm production startup:
- `cd foodtracker-backend`
- `yarn install --frozen-lockfile`
- `yarn build`
- `yarn start:prod`

3. Ensure backend binds correctly:
- App should listen on `0.0.0.0` and configured port.

4. Ensure health endpoint exists:
- Example: `GET /health`

5. Security hardening:
- Validation pipes enabled
- Rate limiting
- Secure headers (helmet or equivalent)
- Strict CORS allowlist

## Phase 3: Move Backend to New Computer

1. Install dependencies on new machine:
- Node (same major version as local)
- Yarn
- Git

2. Transfer code:
- Prefer `git clone` from your remote repository.

3. Install and build:
- `cd foodtracker-backend`
- `yarn install --frozen-lockfile`
- `yarn build`

4. Configure secrets/env in host environment.

5. Run database migrations/seeds in production mode.

6. Start backend and verify local connectivity before exposing public traffic.

## Phase 4: Production Hosting Setup

1. Configure reverse proxy:
- Route public HTTPS traffic to backend internal port.

2. Configure DNS:
- `A`/`AAAA` record for `food.sonorousduck.com` to server IP.
- If splitting later, add `api.food.sonorousduck.com`.

3. Configure TLS certificates (Let’s Encrypt recommended).

4. Firewall:
- Expose only `80` and `443` publicly.
- Keep internal app port private.

5. Process supervision:
- `systemd` or `pm2` auto-start on boot.

6. Logs:
- Centralize app logs and enable rotation.

## Phase 5: Database, Backup, Recovery

1. Strong DB credentials and least-privilege user.

2. Automated backups (at least daily).

3. Test restore from backup before go-live.

4. Prepare migration rollback procedure.

## Phase 6: Frontend Integration (Web + Mobile)

1. Set production API base URL in frontend config:
- If shared hostname + custom API port:
  - `https://food.sonorousduck.com:<api-port>`
- If split-hostname:
  - `https://api.food.sonorousduck.com`

2. Confirm auth/session behavior against production API.

3. iOS App Store requirement:
- Production API must be HTTPS with valid certificate.

4. Build and test production web bundle against deployed API.

## Phase 7: CI/CD and Release Flow

1. CI pipeline checks:
- Backend lint/test/build
- Frontend lint/test/build

2. Deployment sequence:
- Build -> migrate -> restart service -> health check.

3. Keep secrets outside git (host env or secret manager).

4. Prepare rollback runbook:
- Revert deployment
- Roll back DB migration (if needed)
- Restart stable version

## Phase 8: Monitoring and Operations

1. Uptime monitor on `/health`.

2. Error tracking (backend and frontend).

3. Basic infra/app metrics:
- CPU, memory, request latency, error rate.

4. Alerting:
- Downtime and high error-rate notifications.

## Phase 9: Pre-Launch Validation

1. Backend tests pass.

2. Frontend tests pass.

3. End-to-end user flows validated:
- Auth
- Core CRUD
- Any upload/sync paths

4. CORS verified from production website and mobile production builds.

5. DNS + TLS + API URLs verified in release builds.

---

## Immediate Next Actions (Phase 1 Completion)

1. Confirm final API exposure model:
- Keep `food.sonorousduck.com` with custom API port, or split to `api.food.sonorousduck.com`.

2. Pick DB model:
- Managed DB (recommended) or self-hosted DB on deployment machine.

3. Pick reverse proxy:
- Caddy (simpler TLS automation) or Nginx (more manual but common).

4. Pick service manager:
- `systemd` (recommended on Linux servers) or `pm2`.
