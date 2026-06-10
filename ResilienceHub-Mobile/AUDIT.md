# ResilienceHub-Mobile — Production-Readiness Audit

**Date:** 2026-06-10
**Scope:** `ResilienceHub-Mobile/` (Expo / React Native 0.72, RN Navigation 6, TanStack Query 4)
**Codebase size:** ~21,900 LOC across 20 screen files, 1 API service, 1 theme file.

This audit covers **code structure / maintainability**, **performance & rendering**, **memory leaks**, **data layer**, **security**, and **production hardening**. Findings are ranked. A concrete target structure and a phased remediation plan are at the end.

---

## 0. Executive summary

The app works, but it is built as **20 monolithic screen files** with almost no shared abstractions. The three biggest screens are 3,071 / 2,726 / 2,370 lines each. There is **no `components/`, `hooks/`, `context/`, `types/`, or `constants/` layer**. `@tanstack/react-query` is installed and wired into `App.tsx` but **never used** — every screen hand-rolls `useEffect` + `useState` fetching with an `isMounted` flag. Auth state (userId, role, token) is read from `SecureStore` ad-hoc, dozens of times, on every screen instead of living in a context.

None of these are blockers individually, but together they make the app hard to maintain, hard to test (there are **zero tests** and **no ESLint/Prettier**), and they leave real performance and security gaps. The good news: the fixes are mostly mechanical and can be staged without a rewrite.

**Top priorities for production:**
1. Adopt React Query for all reads/writes (it's already a dependency) — fixes caching, refetch, and most `isMounted` leak patterns at once.
2. Introduce an `AuthContext` so userId/role/token are loaded once, not re-read from SecureStore on every screen.
3. Replace `ScrollView + .map()` with `FlatList` on the data-heavy screens.
4. Strip `console.log` of response bodies/tokens; gate logging behind `__DEV__`.
5. Break the 4 mega-screens into feature folders with extracted components, styles, and static data.

---

## 1. Code structure & maintainability

### 1.1 Flat structure with monolithic files — **High**
Current layout:
```
src/
  screens/   (20 files, several 1,500–3,000+ lines)
  services/  (api.ts)
  styles/    (theme.ts)
```
There is no separation between presentation, data, domain types, and static content. Examples:
- `EmotionTrackingScreen.tsx` (3,071 lines) embeds the entire `emotionGroups` taxonomy and `EXAMPLE_SITUATIONS` as inline constants alongside SVG chart code, modals, and fetch logic.
- `ReframeCoachScreen.tsx` has **29** `.map()` render loops; `JournalScreen.tsx` has **33**. These are clearly multiple components living in one file.

**Impact:** every change risks unrelated regressions; code review is impractical; no reuse across screens (the drawer/logout block is copy-pasted 3× in `App.tsx`).

**Fix:** adopt a feature-first structure (see §8) and extract sub-components, static data, and styles out of the mega-screens.

### 1.2 `App.tsx` is 674 lines with 3× duplicated navigators — **High**
`DrawerNavigator`, `TherapistDrawerNavigator`, and `AdminDrawerNavigator` (plus their `*DrawerContent` and `*Tabs`) are near-identical copies. The drawer header, logout handler, and `screenOptions` are repeated verbatim three times (`App.tsx:135-188`, `446-499`, `547-601`).

**Fix:** extract `navigation/` with a single configurable `RoleDrawer`, a shared `DrawerHeader`, a shared `LogoutButton`, and a `useLogout()` hook. Move each role's tab config into a data array. This alone removes ~300 lines.

### 1.3 No shared component library — **High**
Buttons, cards, inputs, modals, loading/empty states, and section headers are re-implemented inline in every screen with hardcoded hex colors. `theme.ts` exists but only exports `COLORS` + two button styles, and most screens ignore it (hardcoded `#052e16`, `#059669`, `#34d399` strings are scattered everywhere, including `App.tsx`).

**Fix:** build `components/ui/` (Button, Card, Input, ScreenContainer, EmptyState, LoadingState, Badge) and route every color through the theme. Add spacing/typography/radius scales to the theme, not just colors.

### 1.4 Pervasive `any` typing — **Medium**
`any` appears 57× in `api.ts` (every method returns `ApiResponse<any>`), and 100+ times across screens (`DashboardScreen` 14, `ReframeCoachScreen` 21, `ResourceLibraryScreen` 20). `navigation: any` is the prop type on every screen. `strict: true` is set in tsconfig but is effectively defeated by the `any` flood.

**Fix:** create `src/types/` with domain models (User, Emotion, ThoughtRecord, Goal, JournalEntry, Resource, Notification) and type `ApiService` generically. Use `@react-navigation/native` typed navigators (`NativeStackScreenProps`) instead of `navigation: any`.

### 1.5 No linting / formatting / pre-commit — **Medium**
No ESLint, Prettier, or Husky config. Style is inconsistent (mixed quote styles, inline-everything). This is table stakes for a team and for catching the issues below automatically (e.g. `react-hooks/exhaustive-deps`, no-unused-vars).

**Fix:** add `eslint-config-universe` (Expo's preset) + Prettier + a `lint`/`typecheck` script + a pre-commit hook.

---

## 2. Data layer

### 2.1 React Query installed but unused — **High**
`QueryClientProvider` wraps the app (`App.tsx:606`) with sensible `staleTime`/`retry` defaults, but **no screen uses `useQuery`/`useMutation`**. Every screen instead does:
```ts
useEffect(() => {
  let isMounted = true;
  (async () => { const res = await ApiService.getX(); if (isMounted) setState(res.data); })();
  return () => { isMounted = false; };
}, []);
```
**Impact:** no caching (every screen visit refetches), no background refetch, no dedup, no shared loading/error semantics, and the `isMounted` boilerplate is hand-maintained per screen (and several screens omit it — see §4).

**Fix:** wrap `ApiService` calls in `useQuery`/`useMutation` via a `hooks/queries/` layer (e.g. `useEmotions(userId)`, `useCreateEmotion()`). This removes the `isMounted` pattern entirely (React Query cancels/ignores stale results), gives free caching + invalidation, and standardizes loading/error UI.

### 2.2 Auth/session read from SecureStore on every screen — **High**
`SecureStore.getItemAsync('userId')` is called repeatedly — e.g. `EmotionTrackingScreen` reads it at lines 173, 278, 1069, 1107; `ThoughtRecordScreen` at 633, 655, 698. Role is re-read in `ResourceLibraryScreen:461`, etc. The auth token lives in a **static field** `ApiService.authToken` that is only repopulated when `LoginScreen` mounts (`LoginScreen:54`). 

**Impact:** redundant async disk reads on hot paths; auth/identity logic is duplicated and easy to get inconsistent; if a screen is reached without `LoginScreen` mounting first, the token is unset.

**Fix:** add `context/AuthContext.tsx` that loads `{ userId, email, role, token }` once at startup, exposes `useAuth()`, calls `ApiService.setAuthToken()`, and centralizes login/logout. Screens consume `useAuth()` instead of touching SecureStore.

### 2.3 `ApiService` uses raw `fetch` while `axios` is a dependency — **Medium**
`axios` is in `package.json` but `api.ts` uses `fetch` directly with hand-rolled JSON parsing and error handling. Either is fine, but shipping an unused HTTP client adds weight and confusion. Also: `credentials: 'include'` (cookie/session auth) is combined with a `Bearer` token — pick one auth model; carrying both is a smell and a potential CSRF/session-fixation surface.

**Fix:** remove `axios` if staying on `fetch`, or migrate to axios with interceptors (token injection + 401 handling in one place). Decide cookie vs. bearer.

### 2.4 401 handler clears creds but doesn't redirect — **Medium**
`api.ts:49-58` deletes tokens from SecureStore on a 401 but doesn't reset `userRole` and has no way to bounce the user to Login (it's a static class with no navigation access). The user is left on an authenticated screen with a cleared token until the next manual action.

**Fix:** surface 401s through React Query's error handling / an event the `AuthContext` listens to, and navigate to Login centrally.

---

## 3. Performance & rendering

### 3.1 `ScrollView + .map()` instead of `FlatList` on data lists — **High**
Most list rendering uses `.map()` inside a `ScrollView`, which mounts **every** row up front (no virtualization). Counts: `JournalScreen` 33 maps / 0 FlatList, `ReframeCoachScreen` 29 / 0, `EmotionTrackingScreen` 19 / 0, `GoalsScreen` 17 / 0, `ResourceLibraryScreen` 17 maps. For lists that grow with user history (journal entries, emotions, thought records, goals), this means rendering and retaining the full list in memory.

**Fix:** convert unbounded, homogeneous lists to `FlatList`/`SectionList` with `keyExtractor`, `getItemLayout` where possible, and memoized `renderItem`. Keep `.map()` only for small fixed sets (e.g. the 6 emotion cores).

### 3.2 Inline styles & inline closures in render — **Medium**
Inline `style={{…}}` objects and inline arrow handlers are everywhere (the entire `App.tsx` drawer is inline styles; screens follow suit). Each render allocates new objects/functions, defeating `React.memo` and causing child re-renders. `JournalScreen` has 7 `StyleSheet.create` blocks while most screens still inline the majority of styling.

**Fix:** move static styles into `StyleSheet.create` (created once, referenced by handle), and wrap row components in `React.memo` with stable `useCallback` handlers. This matters most on the FlatList rows from §3.1.

### 3.3 Large static data inside component modules — **Medium**
`emotionGroups` (6 cores × tertiary arrays) and `EXAMPLE_SITUATIONS` live inside `EmotionTrackingScreen.tsx`. They're module-level (so not re-created per render — good), but they bloat the screen file and ship with the component bundle.

**Fix:** move to `src/constants/emotions.ts` etc. Pure data, easy win for file size and reuse.

### 3.4 No memoization of derived data — **Medium**
Chart computations (the SVG paths in `EmotionTracking`/`EmotionHistory`) and filtered/sorted lists appear to be computed inline on every render without `useMemo`. With manual `useState` fetching, any parent state change re-runs them.

**Fix:** `useMemo` for chart geometry and any `.filter().sort().reduce()` over fetched data; this pairs naturally with the React Query migration (stable data references).

---

## 4. Memory leaks & lifecycle

### 4.1 Inconsistent async cleanup — **High**
Only 5 screens use the `isMounted` guard (`Dashboard`, `ClientProfile`, `TherapistDashboard`, `ClientDataView`, `AdminDashboard`). The large interactive screens (`EmotionTracking`, `ThoughtRecord`, `Journal`, `ReframeCoach`, `Goals`) call `setState` after `await` **without** a mount guard — if the user navigates away mid-request, that's a state update on an unmounted component (React warning + retained closure). Because these screens are reached via tab/drawer (kept mounted) the symptom is often hidden, but it's a real leak under navigation churn and slow networks.

**Fix:** the React Query migration (§2.1) eliminates this class of bug wholesale — no manual guards needed.

### 4.2 No request cancellation — **Medium**
`ApiService.request` never receives an `AbortSignal`. In-flight requests can't be cancelled on unmount/navigation, so responses (and their JSON bodies) are parsed and discarded.

**Fix:** thread an `AbortController`/signal through `request()` (React Query provides the signal automatically when you pass it through).

### 4.3 Tab/drawer screens never unmount — **Low/Medium**
All primary screens live under tab + drawer navigators, so they stay mounted with their full subtree (including the big `.map()` lists from §3.1) for the whole session. Combined with non-virtualized lists, memory grows with usage and never releases.

**Fix:** FlatList virtualization (§3.1) is the main mitigation; consider `unmountOnBlur` for the heaviest screens if profiling shows pressure.

---

## 5. Security & privacy (clinical app — elevated bar)

### 5.1 Sensitive data logged to console — **High**
- `api.ts:100` logs the **full login response body** (`JSON.stringify(response.data)`) — which may include the auth token and PII.
- `api.ts:124` logs the register response.
- `LoginScreen` has 3 `console` calls; `ResourceLibraryScreen` has 11; ~30 `console.*` calls total ship in production.

For a mental-health app handling clinical data, logging tokens/PII (which persist in device logs and crash reporters) is a compliance and security risk.

**Fix:** remove all response-body logging; gate any remaining diagnostics behind `if (__DEV__)`; strip logs in production via `babel-plugin-transform-remove-console`.

### 5.2 Mixed auth model & CORS posture — **Medium**
`credentials: 'include'` + `Bearer` token together (§2.3). Decide one. If cookies, ensure `SameSite`/CSRF protections server-side; if bearer, drop `credentials: 'include'`.

### 5.3 Hardcoded dev host & no env validation — **Medium**
`api.ts:5` / `app.config.js` default to `http://127.0.0.1:5005` (cleartext HTTP). There's no guard that production builds point at HTTPS. A misconfigured build could ship pointing at localhost or over HTTP.

**Fix:** require `EXPO_PUBLIC_API_URL` in release builds, assert `https://`, and fail the build if unset. Document the env contract.

### 5.4 No certificate pinning / minimal transport hardening — **Low (context-dependent)**
For a clinical app, consider TLS pinning and ensuring ATS (iOS) / cleartext-traffic disabled (Android) in the native config.

---

## 6. Error handling & UX robustness

### 6.1 `Alert.alert` as the only error channel — **Medium**
Errors surface as native alerts (or are swallowed). There's no consistent inline error state, retry affordance, or toast system. Network failures on the manual-fetch screens often just leave a spinner or empty content.

**Fix:** standard `ErrorState`/`EmptyState` components + React Query's `error`/`isError`/`refetch` for retry. Add an error boundary at the navigator root.

### 6.2 No offline handling — **Medium**
No connectivity awareness (`@react-native-community/netinfo` not present). A therapy app used on the go needs at least a "you're offline" state and retry-on-reconnect. React Query + a network manager covers most of this.

### 6.3 `RefreshControl` present on some screens, absent on others — **Low**
Pull-to-refresh is inconsistent. Standardize via the query hooks.

---

## 7. Tooling, testing, CI — **High (for "production ready")**

- **Zero tests.** No Jest, no React Native Testing Library, no e2e. For a clinical app this is the biggest production gap after security.
- **No ESLint/Prettier/typecheck in CI.**
- **No error/crash reporting** (Sentry or equivalent) — you'll be blind to production crashes.
- **No analytics/observability.**

**Fix (minimum bar):**
1. Jest + RNTL; start with `ApiService`, the auth context, and 2–3 critical flows (login, create emotion, create thought record).
2. ESLint + Prettier + `tsc --noEmit` wired into a CI workflow.
3. Sentry (with PII scrubbing) for crash + error reporting.

---

## 8. Recommended target structure

```
src/
  api/
    client.ts            # fetch/axios wrapper, interceptors, AbortSignal, 401 handling
    endpoints/           # emotions.ts, thoughts.ts, goals.ts, journal.ts, ... (typed)
  hooks/
    queries/             # useEmotions, useCreateEmotion, useGoals, ... (React Query)
    useAuth.ts
  context/
    AuthContext.tsx
  components/
    ui/                  # Button, Card, Input, Badge, ScreenContainer, EmptyState, LoadingState
    charts/              # EmotionChart, ProgressChart (extracted SVG)
  features/
    emotions/            # screens + local components + styles + constants
    thoughts/
    journal/
    goals/
    reframe/
    resources/
    auth/                # Login, Register, Onboarding
    therapist/           # TherapistDashboard, ClientDirectory, ClientProfile, ClientDataView
    admin/               # AdminDashboard, UserManagement
  navigation/
    RootNavigator.tsx
    RoleDrawer.tsx       # single config-driven drawer (replaces 3 copies)
    tabs.config.ts       # client/therapist/admin tab definitions as data
  constants/             # emotions.ts, situations.ts, etc.
  types/                 # domain models
  theme/                 # colors, spacing, typography, radii
```

---

## 9. Phased remediation plan

**Phase 1 — Safety & hygiene (low risk, high value, ~days)**
- Strip console logging of response bodies/tokens; gate logs behind `__DEV__`; add `transform-remove-console`.
- Add ESLint + Prettier + `typecheck` script + CI.
- Enforce HTTPS in release builds; require `EXPO_PUBLIC_API_URL`.
- Extract static data (`emotions`, `situations`) to `constants/`.

**Phase 2 — Data & auth layer (medium risk, biggest leverage)**
- Add `AuthContext`; remove ad-hoc `SecureStore.getItemAsync('userId')` reads.
- Migrate screens to React Query hooks (start with read-only screens, then mutations). Deletes the `isMounted` boilerplate and fixes §4.1.
- Add `AbortSignal` through the API client; centralize 401 → logout.
- Type `ApiService` + add `types/` domain models; remove `any`.

**Phase 3 — Rendering & componentization**
- Convert unbounded lists to `FlatList` with memoized rows.
- Build `components/ui/`; route colors through theme; move inline styles into `StyleSheet.create`.
- Break the 4 mega-screens into feature folders with sub-components.
- Collapse the 3 duplicated drawer navigators into one config-driven `RoleDrawer`.

**Phase 4 — Production hardening**
- Sentry + error boundary; offline/NetInfo handling; standardized error/empty states.
- Jest + RNTL tests for critical flows.
- Optional: TLS pinning, `unmountOnBlur` on heavy screens after profiling.

---

## 10. Quick reference — findings by severity

| # | Finding | Severity | Area |
|---|---------|----------|------|
| 5.1 | Tokens/PII logged to console | High | Security |
| 2.1 | React Query installed but unused | High | Data |
| 2.2 | Auth/userId re-read from SecureStore per screen | High | Data |
| 4.1 | Inconsistent async cleanup on big screens | High | Memory |
| 3.1 | ScrollView+map instead of FlatList | High | Performance |
| 1.1 | Monolithic 1.5k–3k line screens | High | Structure |
| 1.2 | App.tsx: 3× duplicated navigators | High | Structure |
| 1.3 | No shared component/theme system | High | Structure |
| 7 | No tests / lint / crash reporting | High | Tooling |
| 1.4 | Pervasive `any` typing | Medium | Structure |
| 2.3 | axios unused; fetch + cookie+bearer mix | Medium | Data/Security |
| 2.4 | 401 clears creds but no redirect | Medium | Data |
| 3.2 | Inline styles/closures defeat memoization | Medium | Performance |
| 3.3 | Large static data in component files | Medium | Performance |
| 3.4 | No useMemo on chart/derived data | Medium | Performance |
| 4.2 | No request cancellation | Medium | Memory |
| 5.3 | Hardcoded HTTP localhost; no env guard | Medium | Security |
| 6.1 | Alert-only error handling | Medium | UX |
| 6.2 | No offline handling | Medium | UX |
| 1.5 | No ESLint/Prettier | Medium | Tooling |
| 4.3 | Tab/drawer screens never unmount | Low/Med | Memory |
| 5.2 | Mixed auth model | Medium | Security |
| 5.4 | No TLS pinning | Low | Security |
| 6.3 | Inconsistent pull-to-refresh | Low | UX |

---

## 11. Remediation log — Round 1 (high-priority fixes applied)

This round addressed the highest-severity findings end-to-end and laid the foundation
(AuthContext + React Query hooks + shared navigation/components) that the remaining
per-screen migrations build on. **All changes verified with `tsc --noEmit` (clean) and
`eslint` (0 errors).**

### ✅ 5.1 — Sensitive logging removed (Security)
- Added `babel-plugin-transform-remove-console`, wired into `babel.config.js` under
  `env.production` → **all `console.*` calls are stripped from production bundles**, so no
  tokens/PII can leak to device logs or crash reporters.
- Deleted the dead commented-out response-body log lines in `src/services/api.ts`.

### ✅ 1.2 — Duplicated navigators collapsed (Structure)
- `App.tsx`: **674 → ~95 lines.** The three near-identical client/therapist/admin drawer
  navigators are replaced by one config-driven factory.
- New: `src/navigation/createRoleNavigator.tsx` (factory), `src/navigation/roleConfigs.tsx`
  (declarative per-role tab/drawer config).

### ✅ 1.3 — Shared theme + components (Structure, partial)
- `src/styles/theme.ts`: added `SPACING`, `RADII`, and the drawer accent/overlay/danger
  colors that were previously hardcoded hex strings scattered across `App.tsx`.
- New shared components: `src/components/navigation/DrawerHeader.tsx`, `LogoutButton.tsx`,
  `LanguageSwitcher.tsx`.

### ✅ 2.2 — AuthContext (Data)
- New: `src/context/AuthContext.tsx` (`AuthProvider` + `useAuth`). Loads session once at
  startup and **primes the API token before any screen mounts** — fixes the bug where the
  token was only set if `LoginScreen` happened to mount first.
- Wired `AuthProvider` into `App.tsx`; migrated `LoginScreen`, `RegisterScreen`, the drawer
  logout (`src/hooks/useLogout.ts`, used ×3), and both `SettingsScreen` logout paths to go
  through `signIn`/`signOut`. Also fixes `userRole` not being persisted on register and the
  Settings logout paths not clearing `userRole`.
- _Remaining:_ ~18 screens still call `SecureStore.getItemAsync('userId')` directly in their
  effects. These keep working (SecureStore is still written), and migrate to `useAuth().userId`
  incrementally alongside the React Query rollout below.

### ✅ 2.1 / 4.1 — React Query foundation + reference migration (Data / Memory)
- New hooks layer: `src/hooks/queries/utils.ts` (`unwrap` + centralized `queryKeys`) and
  `src/hooks/queries/useNotifications.ts`.
- **`NotificationsScreen` fully migrated** as the reference pattern: `useQuery` + `useMutation`
  replace the manual `useEffect` fetch, adding caching, cache-patching mutations, an error+retry
  state, and pull-to-refresh — and eliminating the unguarded `setState`-after-`await` leak class.
- _Remaining:_ apply the same pattern to the other data screens (Emotion, Thought, Journal,
  Goals, Resources, dashboards). Each gets a `src/hooks/queries/useX.ts` and drops its
  `isMounted`/manual-fetch boilerplate.

### ✅ 7 — Tooling (partial)
- Added ESLint (`eslint-config-universe`, pinned to the SDK-49-compatible v12) + Prettier +
  scripts: `npm run typecheck | lint | format`.
- **Lint immediately caught 4 real `react-hooks/rules-of-hooks` violations** (hooks called after
  an early return in `GoalsScreen` and `JournalScreen`) that could crash render — **all fixed.**
- _Remaining:_ 115 non-blocking warnings (mostly unused imports; 24 auto-fixable via `--fix`),
  plus tests and crash reporting (Sentry) still to add.

### Still outstanding from the High tier
- **3.1 FlatList** — convert the `ScrollView + .map()` lists (Journal, Reframe, Emotion, Goals)
  to `FlatList`. Pairs naturally with each screen's React Query migration.
- **1.1 Monolithic screens** — split the 1.5k–3k line screens into feature folders.
- These are large, per-screen, and should be done with device/runtime testing for each screen.

---

## 12. Remediation log — Round 2 (React Query rollout + lint cleanup)

Verified with `tsc --noEmit` (clean), `eslint` (0 errors), and a production `expo export`.

### ✅ Lint config tuned + warnings cleared in stable screens
- Dropped the type-aware `universe/shared/typescript-analysis` preset: its `prefer-nullish-coalescing`
  autofix is unsafe for a codebase that intentionally uses `value || default` falsy-coalescing.
  Kept the high-value rules (react-hooks, no-unused-vars, radix). Warnings: **115 → 29.**
- Remaining 29 are all in the not-yet-migrated mega-screens (cleaned during their migration).

### ✅ React Query hooks layer (complete for all domains)
New `src/hooks/queries/`: `useEmotions`, `useThoughts`, `useJournal`, `useGoals`, `useReframe`,
`useAdmin`, `useTherapist`, `useResources`, `useProfile`, `useNotifications` — each with read query
(+ mutations where the screens write), all keyed via the central `queryKeys` factory and unwrapping
`ApiResponse` through `unwrap()`.

### ✅ Screens migrated to React Query + `useAuth` (manual fetch / `isMounted` / `getCurrentUser`-for-userId removed)
- `NotificationsScreen` (Round 1), `EmotionHistoryScreen`, `AdminDashboardScreen`,
  `DashboardScreen` (stats computation moved into `useMemo`), `TherapistDashboardScreen`,
  `UserManagementScreen`.
- Each now gets caching, dedup, automatic refetch, and no unmount-setState leak.

### Remaining (next batches — large, per-screen, want device testing)
- **RQ migration:** `ClientDirectory`, `ClientProfile`, `ClientDataView`, `ResourceLibrary`, and the
  5 mega-screens (`EmotionTracking`, `ThoughtRecord`, `Journal`, `ReframeCoach`, `GoalsScreen`).
  The hooks they need already exist — each migration is now the same mechanical swap demonstrated above.
- **FlatList (#3.1):** `Journal`, `ReframeCoach`, `EmotionTracking`, `Goals` (the `ScrollView + .map()` screens).
- **Feature-folder restructure (#1.1):** best done last, once migrations settle, to avoid double import churn.
- **Remaining 29 lint warnings:** resolved as each mega-screen is migrated.

---

## 13. Remediation log — Round 3 (React Query rollout complete)

Verified with `tsc --noEmit` (clean), `eslint` (**0 warnings, 0 errors**), and a production `expo export`.

### ✅ All remaining screens migrated to React Query + `useAuth`
`ClientDirectory`, `ClientProfile`, `ClientDataView`, `ResourceLibrary`, and the five mega-screens
`GoalsScreen`, `JournalScreen`, `ThoughtRecordScreen`, `EmotionTrackingScreen`, `ReframeCoachScreen`.

Every screen now sources its server data from the `src/hooks/queries/` layer. Result:
- **Zero `useEffect`+`isMounted`/`getCurrentUser`-for-userId fetch blocks remain.** The unmount-setState
  leak class (#4.1) is fully eliminated across the app.
- **No screen calls `SecureStore.getItemAsync('userId')` anymore** — identity comes from `useAuth()`,
  which also removed every `parseInt(userId)` (and the associated `radix` lint warnings).
- Client-data screens (`ClientProfile`, `ClientDataView`) reuse the same `useEmotions/useThoughts/…`
  hooks parameterized by `clientId` — one hook set serves both "my data" and "client's data".
- Mutation handlers (create/update/delete across emotions, thoughts, journal, goals, milestones,
  protective factors, coping strategies, resources) now invalidate/refetch through the query cache
  instead of hand-rolled local-state patching.

### New hooks added this round
`useReframeProfile`, `useAllMilestones`, `useProtectiveFactors`, `useCopingStrategies`,
`useTherapistAssignments`, `useInvitations`, therapist stat hooks, and an `enabled`-gated
`useTherapistClients` (so client-role users don't hit therapist-only endpoints).

### ✅ Lint warnings: 29 → 0
All unused imports/vars, `radix`, and `no-useless-escape` warnings across the mega-screens were
cleared as part of their migration. `npm run lint` and `npm run typecheck` are both green.

### Still outstanding (next batches)
- **FlatList (#3.1):** `Journal`, `ReframeCoach`, `EmotionTracking`, `Goals` still render lists via
  `ScrollView + .map()`. Data layer is now clean, so these are isolated view-layer changes.
- **Feature-folder restructure (#1.1).**
- **Device/simulator testing** of each migrated screen before shipping (static checks + bundle pass,
  but runtime behavior — refetch-on-focus timing, mutation refresh — should be confirmed on device).
