# Verify the custom website after publishing

Publishing success does not establish that a custom domain serves the new frontend.
This read-only check complements (and does not replace) the built-output regression
test in `tests/e2e/production-assets.spec.ts`.

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
It is an explicit post-publish check, not a deployment hook: do not put it in
`npm run build`, where the prior release would still be serving.
