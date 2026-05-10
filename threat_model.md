# Threat Model

## Project Overview

ResilienceHub is a mental-health application for clients, therapists, and admins. The production system is primarily a React SPA in `client/` backed by an Express API in `server/`, with PostgreSQL/Drizzle storage in `shared/`. The repo also contains a React Native mobile app in `ResilienceHub-Mobile/` that talks to the same backend API. The app handles sensitive mental-health records, therapist-client relationships, invitations, notifications, exports, payments, and AI-assisted analysis.

## Assets

- **User accounts and sessions** — usernames, email addresses, hashed passwords, session IDs, therapist/admin roles, and therapist-client assignments. Compromise allows impersonation and unauthorized access to therapy data.
- **Sensitive therapy data** — journal entries, thought records, emotions, goals, comments, recommendations, notifications, and progress exports. This is highly sensitive health-adjacent personal data.
- **Invitation and onboarding data** — therapist-issued invitations, temporary credentials, invite links, pending client accounts, and therapist assignment state. Abuse here can let someone claim or redirect a client account.
- **Billing and integration state** — Stripe customer/subscription identifiers, webhook handling, and subscription status. Compromise can change account entitlements or billing state.
- **Application secrets and service credentials** — database credentials, OpenAI keys, SparkPost keys, Stripe keys, cookie secret, and any environment-based allowlists. Leakage or weak fallback behavior can expose protected operations.
- **Operational logs and exports** — API logs, email logs, reminder logs, CSV/PDF/HTML exports, and any centralized log sink receiving stdout/stderr. These copies can expose therapy content and account metadata outside the normal application authorization boundary.

## Trust Boundaries

- **Browser/mobile client to API** — all user input crosses from an untrusted client into `server/routes.ts` and related middleware. Every protected route must authenticate and authorize on the server.
- **API to database** — the API has direct read/write access to user records, therapy content, invitations, sessions, and billing state. Injection or broken access control here exposes the full dataset.
- **API to third-party services** — the server sends data to Stripe, OpenAI, and SparkPost. These calls must use validated inputs and strong secret handling.
- **Public to authenticated to privileged roles** — public registration and login are lower-trust surfaces; therapist/admin routes and therapist-to-client access checks form additional privilege boundaries.
- **Therapist/admin authored content to client browser** — therapists/admins can create content that is later rendered in client sessions. Stored content must be treated as untrusted at render time.
- **Application data to logs and exports** — once sensitive records are copied into logs or downloadable exports, they often leave the normal in-app authorization model and may become visible to operators, support tooling, or end-user desktop software.
- **Development-only to production** — `/api/test/*`, preview helpers, and other dev conveniences are out of scope unless production reachability is demonstrated.

## Scan Anchors

- **Production entry points**: `server/index.ts`, `server/routes.ts`, `server/middleware/auth.ts`, `server/middleware/csrf.ts`.
- **Highest-risk code areas**: auth/session logic, public registration (`/api/auth/register`), invitation creation and acceptance flows, therapist/client authorization checks, current-viewing-client state, Stripe webhook handling, resource-library rendering, export generation (especially CSV), AI-triggering routes, API/logging middleware, and admin/therapist management routes.
- **Public vs authenticated vs admin surfaces**: `/api/auth/*`, invitation-related registration and invite issuance, webhook routes, export endpoints, therapist assignment routes, and the large authenticated API surface in `server/routes.ts` guarded by `authenticate`, `checkUserAccess`, `isTherapist`, and `isAdmin`.
- **Usually dev-only**: `/api/test/*`, Vite/dev helpers, preview/mobile-local fallbacks. Ignore unless shown reachable in production.

## Threat Categories

### Spoofing

The application relies on a `sessionId` cookie and role-based server checks. The system must reject forged sessions, require valid authenticated context on protected routes, and verify externally triggered actions such as Stripe webhooks with non-default secrets. Invitation-based onboarding must prove that the registrant actually possesses the invitation, not just the target email address or a guessable invitation URL structure.

### Tampering

Clients, therapists, admins, and external services can all submit state-changing requests across the API boundary. The server must enforce ownership and role checks for every state change, must not trust client-provided role or relationship fields without validation, and must ensure therapist/admin-authored content cannot silently inject active script into other users’ sessions.

### Information Disclosure

The system stores highly sensitive therapy and account data. API responses, exports, logs, notifications, and rendered content must not expose data beyond the intended user or therapist/admin boundary. Temporary credentials, invite metadata, log payloads, and third-party service errors should never be exposed more broadly than necessary.

### Denial of Service

Public auth endpoints, expensive AI operations, export generation, and externally callable routes can be abused to consume compute or third-party quotas. Authentication and password-reset endpoints need rate limiting, and expensive server-side operations should not be triggerable without appropriate controls. Authenticated AI analysis routes, including indirect AI triggers on normal feature paths such as comments, need per-user quotas or input-size limits so a normal account cannot burn shared OpenAI budget.

### Elevation of Privilege

The biggest project-specific risks are broken therapist/client authorization, client-registration flows that create or attach accounts without adequate proof, public registration paths that trust caller-controlled role fields, webhook or integration spoofing that changes subscription state, and stored XSS that lets one user act inside another user’s authenticated browser context. The backend must enforce privilege boundaries independently of frontend behavior.
