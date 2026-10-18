# Isolated record and access checks

Run `npm run test:e2e` from the repository root. By default this runs the full
Chromium suite plus the phone journeys on **WebKit**, using an iPhone 13 profile
(Safari user agent, touch, mobile screen and device scale). WebKit is the actual
browser engine, not Chromium with an iPhone-shaped viewport.

For a focused check, pass spec filenames, for example:
`npm run test:e2e -- thought-challenge-flow.spec.ts`.
The runner also accepts `--browser=all` (the default), `--browser=chromium`, or
`--browser=webkit`. For example:
`npm run test:e2e -- --browser=webkit`.
Only these browser choices, `--production-build`, and spec filenames are accepted;
the same database and network isolation applies. Browser-path and browser-selection
environment overrides are not inherited. Do not invoke Playwright directly.

The `iphone-webkit` project runs the `@phone` journeys in
`thought-challenge-flow.spec.ts`, `phone-navigation.spec.ts`, and
`thought-save-actions.spec.ts`; the
remaining desktop/access/record checks continue to run in Chromium. Both projects
use the same assertions, no retries, and real isolated-backend saves. Explicit
engine selection never silently falls back to Chromium if WebKit is unavailable.
This is browser-engine coverage, not a physical iPhone test: the 340px-height
case models reduced space but does not open the native iOS keyboard.

To test the actual production-built frontend instead of Vite development pages,
run `npm run build`, then
`npm run test:e2e -- --production-build thought-challenge-flow.spec.ts`.
This still uses disposable accounts, a disposable database, no background
delivery, and an outbound network firewall. Never point it at a published site.

Requirements: Node.js, PostgreSQL tools (`initdb`, `pg_ctl`, `createdb`) on PATH,
and the selected browsers. Install the version-matched WebKit runtime with:
`PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright install webkit`.
On supported Linux hosts, install its system libraries using Playwright's
`install-deps webkit` command as well (or `install --with-deps webkit`).
Replit's `/repl/tools/bin/chromium` is detected automatically; otherwise install
Chromium with `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright install chromium`.
The runner fixes the browser cache to `.cache/ms-playwright` so the sanitized
environment does not accidentally look in a different cache than the installer.
That directory is excluded from Git and publishing. NixOS requires a
Nix-compatible runtime for the same Playwright browser revision; the downloaded
Ubuntu binaries alone are not sufficient. Do not substitute an older Nix WebKit
build: launching it does not establish protocol compatibility.
PostgreSQL initialization must run as a non-root user.

Configuration-only safety checks can run without a database or browser:
`node --test tests/e2e-runner.test.mjs`. They check runner option rejection,
engine selection, the iPhone profile, and refusal of arbitrary base URLs.

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

- iPhone/WebKit and Chromium phone journeys: final thought review; visible HTTP
  503 save failure with thought and situation retained; unchanged retry payload
  and exactly one persisted record; the post-save challenge action; real
  character-by-character entry with complete values and retained focus; challenge
  persistence after refresh. Phone navigation checks 320px and 390px widths,
  340px available height, reachable challenge footer actions, menu/logout
  reachability, and admin/therapist navigation parity. Phone save-action checks
  also assert disabled/busy state during saving and a usable success/challenge
  action while the History refresh is delayed.
- Shared unsaved-writing guard: real sidebar and module-tab pointer/keyboard
  activation, browser back/forward, and native reload prompts. Declining keeps
  the route and writing; accepting leaves once, with no saved record or
  restored browser draft. Local challenge dismissal is covered separately in
  `thought-challenge-unsaved.spec.ts`.
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
