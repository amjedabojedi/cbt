# Isolated record and access checks

Run `npm run test:e2e` from the repository root.

Requirements: Node.js, PostgreSQL tools (`initdb`, `pg_ctl`, `createdb`) on PATH,
and Chromium. Replit's `/repl/tools/bin/chromium` is detected automatically;
else install Playwright's Chromium with `npx playwright install chromium`.
PostgreSQL initialization must run as a non-root user.

The command creates a **new local PostgreSQL cluster** in an OS temporary
directory, applies `shared/schema.ts`, seeds only synthetic `example.invalid`
accounts, launches the real routes and frontend on a random loopback port,
and runs Playwright. The project database and any existing users are never
used. It does not accept an app URL or database URL from the caller.

The child environment is allowlisted rather than copied: no workspace
credentials, database URL, email keys, or `.env` contents reach the app.
Test-only network guards block non-loopback server connections and external
browser requests. No registration, invitations, reminder scheduler, or
email-sending path is used. AI scenario generation alone is supplied as a
deterministic browser fixture; actual session authentication, reads,
authorization, validation, and successful writes use the real backend.

Coverage:

- Emotion, thought, journal, SMART goal and reframe saves through the browser.
- Injected HTTP 503 failures preserve writing/choices; retries write exactly
  one real record. Reframe uses the application's automatic retry behavior.
- Journal creation and tag completion both use the real backend, with input
  retention checked for failures at each stage.
- Database row counts ensure failed attempts did not persist records.
- Real login and persisted-record list/detail access for the owner, assigned
  therapist, unrelated therapist, other client, authorized admin, and anonymous
  caller. Unrelated users cannot write to another client's URL-scoped records.

The runner always stops the app/database and removes its temporary cluster on
normal completion, test failure, SIGINT, and SIGTERM. As with any process,
SIGKILL or host failure cannot run cleanup; leftover `resilience-e2e-*` OS
temporary directories contain only synthetic data. Test reports go to ignored
`generated-artifacts/e2e/`. Screenshots, traces and saved login state are off
by default.

These checks supplement `tests/client-ux-browser.mjs`, whose deliberately
browser-only fixtures cover discard/navigation interactions. They do not
exercise paid AI services, actual email delivery, or billing.
