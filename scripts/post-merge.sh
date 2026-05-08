#!/bin/bash
set -e
npm install
# --force bypasses destructive-change confirmations. The schema must stay in
# sync with the live DB (declare every table in shared/schema.ts) so drizzle
# never falls back to an interactive create-vs-rename prompt — those prompts
# use raw TTY input and cannot be answered with piped stdin.
npm run db:push -- --force
