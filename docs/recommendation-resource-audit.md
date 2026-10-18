# Read-only recommendation resource integrity audit

This opt-in audit checks `ai_recommendations.suggested_resources` against
`resources` across **all** recommendation statuses. It does not change clinical
history, delete anything, or restore resources. It is not run by startup,
scheduled jobs, migrations, or API requests, and has no public endpoint.

## Running (requires approval of the target database)

An authorized operator must explicitly choose and approve the target database
before running. Configure `DATABASE_URL` through the workspace's secret
configuration; do not paste credentials into commands or reports.

```
npm run audit:recommendation-resources -- --run-read-only
```

The command requires the flag, uses a PostgreSQL **read-only transaction**,
limits execution to 30 seconds, and outputs only aggregate JSON. Use a
least-privilege account with SELECT access to the two tables where possible.
An unavailable database or query failure exits unsuccessfully with a generic
error, not raw database diagnostics. No existing client records were queried
to implement or test this audit.

## Count definitions

- `recommendationsScanned`: all recommendations, including null/empty lists.
- `recommendationsWithReferences`: recommendations with nonempty arrays,
  including arrays containing invalid entries.
- `validReferenceOccurrences`: positive integral numeric IDs in the PostgreSQL
  serial range (1–2147483647), whether present or missing.
- `missingReferenceOccurrences`: valid ID occurrences with no matching resource.
- `distinctMissingResourceIds`: unique missing numeric resource IDs.
- `recommendationsWithMissingResources`: recommendations with at least one
  missing valid ID.
- `malformedResourceLists`: non-array values other than SQL NULL or JSON null.
- `invalidReferenceOccurrences`: array elements that are not valid numeric IDs
  (including strings, null, objects, arrays, fractions, and out-of-range values).

SQL NULL, JSON null, and empty arrays contain no references. Duplicate IDs count
once per occurrence, but once per distinct missing ID and affected
recommendation. Malformed containers are counted separately, not expanded.
Unpublished resources still exist and are not considered missing. A single
SELECT provides a consistent snapshot; counts may change after it finishes.

No identifiers, titles, clinical content, reasoning, notes, or per-client/status
breakdowns leave the database. Even aggregate reports should be shared only
with authorized staff.

## Repair is a separate decision

Missing references are findings, **not permission to repair**. Obtain a separate,
explicit clinical/data-owner decision before designing or executing any repair.
That decision must specify which history may change, how to preserve an audit
trail and backup, and how to validate the outcome. Do not silently remove IDs,
rewrite recommendation history, or recreate resources from guesses. This
command has no repair mode.

## Synthetic verification only

```
npx vitest run tests/resource-recommendation-integrity.test.ts
```

Tests use an isolated disposable PostgreSQL cluster, mock the workspace database,
and never load the application database or delivery services. Do not run this
audit against existing client records as part of development or testing.
