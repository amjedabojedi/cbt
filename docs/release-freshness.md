# Verify the custom website after publishing

Publishing success does not establish that a custom domain serves the new frontend.
This read-only check complements (and does not replace) the built-output regression
test in `tests/e2e/production-assets.spec.ts`.

## Azure publishing process (opt-in)

The team publishes using `azure-pipelines.yml`. In Azure DevOps, choose **Run
pipeline**, enable **Verify custom-site freshness after successful deployment**,
and enter the already-configured custom HTTPS origin, with no path or credentials.
The default is off, so ordinary push-triggered runs do not start verification.
Existing publishing triggers and production-environment approvals are unchanged;
configure approval checks on the `production` environment if the team requires
approval before deployment. This feature does not initiate a separate publish.

When opted in:

1. Build packages a standalone verifier into the same ZIP as the frontend. Build
   does **not** run the comparison or contact the currently live site.
2. The existing Deploy stage publishes that ZIP and starts `npm start`, serving
   its compiled production frontend (not Vite's development frontend).
3. Only after Deploy succeeds, a separate **Verify custom-site freshness** stage
   downloads the **current pipeline run's exact same ZIP**, without rebuilding or
   using workspace HTML. It extracts `dist/public/index.html` and the verifier.
4. Through the existing Azure service connection, the verifier obtains fresh
   metadata with `az webapp list`, projecting only app name, running state,
   default hostname, and configured hostnames. It requires one matching running
   app and the specified custom hostname bound to it. The platform origin comes
   from `defaultHostName`; no hostname is inferred from the app name. The service
   connection needs permission to list web apps in its scope.
5. It compares the public platform and custom origins against that exact HTML,
   without cookies or tokens. No app settings, publishing credentials, environment
   secrets, or DNS configuration are read or changed.

Deployment success stays visible in the Deploy stage. Verification reports
`matching`, `mismatch`, `stale`, or `unavailable` separately in its task log.
Non-matching results fail the verification stage (and therefore the overall
pipeline), **not** the already-successful deployment; they do not roll it back or
redeploy. Mismatch/stale exit 1; unavailable exits 2. Infrastructure failures in
artifact download or service-connection setup are verification failures, not
evidence of a failed publish or fresh domain.

Missing metadata, missing/unbound custom origins, unreadable ZIP/HTML, stopped
apps, redirects, startup delays, or gated endpoints must not be treated as
success. The check does not retry automatically; investigate the reported result
and retry verification when appropriate. Do not rerun the entire publishing
pipeline just to retry a check unless another publish is intended. Avoid concurrent
production releases during verification, since a later release can change the
live frontend underneath a check. This confirms frontend identity, not backend
health or clinical behavior.

## Standalone check / Replit publishing

For read-only investigation outside the Azure pipeline:

1. After a user-initiated publish, obtain fresh deployment metadata using the
   deployment skill's `getDeploymentInfo()`. If metadata is unavailable, no active
   deployment exists, or `hasSuccessfulBuild` is false, report freshness as unknown:
   do not claim the latest release is live.
2. Use the platform URL returned by that metadata, not a guessed hostname or an
   environment value. Confirm the intended custom origin in domain settings;
   metadata may omit it. If no platform URL is returned, obtain the verified
   platform URL from publishing settings rather than substituting the custom URL.
3. Run, using those public origins:

   ```sh
   npm run check:release -- --deployment https://verified-platform.example --custom https://configured-custom.example --expected-html dist/public/index.html
   ```

   Use `--expected-html` only with the HTML from the exact build just published.
   An unrelated workspace build is not evidence of the intended published release.
   Omit it when that build is unavailable; the result then establishes URL parity
   only, explicitly not latest-release freshness. Neither command publishes.

## Results

- `matching` (exit 0): both URLs return identical frontend asset names and SHA-256
  content hashes. With expected HTML, their entry identity also matches that build.
- `mismatch` (exit 1): public frontend identities or asset bytes differ. Warn that
  the custom website is not verified as updated; do not infer chronology from hashes.
- `stale` (exit 1): the URLs agree, but neither matches the supplied expected build.
- `unavailable` (exit 2): a request fails, times out, redirects, is gated by login,
  has missing/broken assets, or lacks a supported production identity. Invalid
  configuration also exits 2. This is unknown freshness, never a successful match.

Requests have cache-busting query values, no-cache headers, bounded response sizes
and timeouts. Only `/` and allowlisted hashed `/assets/*.js` and `/assets/*.css`
entry resources are requested. Redirects are deliberately not followed, so a
canonical-domain redirect must be checked separately and the final verified
origin supplied explicitly. No cookies, tokens, authenticated therapy data,
environment values, DNS changes, or publishing operations are used.

The output contains only status, safe diagnostic text, and public asset hashes.
The check tests frontend identity, not backend version or clinical functionality.
The standalone command remains explicit; the Azure pipeline wires the same
comparison into its opt-in post-Deploy stage. Never put the comparison in
`npm run build`, where the prior release would still be serving.
