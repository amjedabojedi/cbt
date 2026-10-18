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

## Clean Replit/NixOS workspace

Requirements: the project's Node.js and PostgreSQL modules, Nix (`nix-build`)
on PATH, and installed npm dependencies. No extra system packages, root access,
manual ELF patching, browser-path exports or workspace secrets are needed.
From the repository root, run:

```sh
npm run setup:e2e:webkit
npm run test:e2e -- --browser=webkit
```

The first command downloads the WebKit revision declared by the **installed**
Playwright package, builds a hash-pinned x86_64 Nix library closure, patches
the downloaded ELF interpreters/RPATHs, and verifies the dependencies and an
offline page render (page creation, text/layout, canvas pixels and PNG output).
It explicitly checks the ELF architecture and dependencies of Mesa EGL,
software DRI, GLES and x264; it never searches `/nix/store` for whichever library
happens to exist. This setup supports x86_64 Linux/NixOS, including clean Replit
workspaces; it fails explicitly on other architectures.

The installer accepts **no arguments**. Its child environment is allowlisted
just like the test runner: it does not inherit database/API credentials,
`NODE_OPTIONS`, custom download hosts, browser paths, `LD_LIBRARY_PATH`, EGL
overrides, Nix configuration, or live app URLs. Network downloads are needed
only for setup. The journeys still use the unchanged disposable database and
outbound test firewall.

All browser files and the Nix closure's GC-root link live under the ignored
`.cache/ms-playwright/` directory. No browser binary is committed or published.
The Nix expression pins library ABIs independently of the workspace channel;
the browser revision is never replaced with an older Nix browser build.
Playwright's Ubuntu `ldconfig` heuristic cannot see Nix libraries: only the
offline smoke child bypasses that heuristic **after** the installer checks
every browser ELF with the pinned `ldd`. Successful rendering then writes
Playwright's normal dependency-validation marker. The journey runner does not
inherit a validation-skip flag or new runtime environment variables.

Re-run setup after changing Playwright, moving the checkout, garbage-collecting
native dependencies, or when Playwright's 30-day validation marker expires.
Setup is idempotent and also repairs an interrupted installation. To reproduce
an entirely empty browser cache (this deletes downloaded test browsers only):

```sh
rm -rf .cache/ms-playwright
npm run setup:e2e:webkit
npm run test:e2e -- --browser=webkit
```

The focused run currently collects seven `@phone` journeys (including all five
original journeys). Setup success alone is not
a journey result: the second command must report **7 passed**. No normal app,
external account, paid AI service, or production endpoint is used.

On a supported non-Nix Linux host, Playwright's ordinary
`PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright install --with-deps webkit`
is an alternative; do not use its Ubuntu installer as the Nix setup.
Replit's `/repl/tools/bin/chromium` is detected automatically; otherwise install
Chromium with `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright install chromium`.
The runner fixes the browser cache to `.cache/ms-playwright` so the sanitized
environment does not accidentally look in a different cache than the installer.
That directory is excluded from Git and publishing.
PostgreSQL initialization must run as a non-root user.

Configuration-only safety checks can run without a database or browser:
`node --test tests/e2e-runner.test.mjs tests/webkit-runtime.test.mjs`. They check
runner option rejection, engine selection, the iPhone profile, refusal of
arbitrary base URLs, setup environment isolation, revision selection, and
rejection of 32-bit runtime libraries.

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
