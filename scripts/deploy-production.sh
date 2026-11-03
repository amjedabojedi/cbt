#!/usr/bin/env bash
# Deploys main of rsehub.ca to production (Azure VM Resilience2).
# The app runs as the unprivileged account cbt-web, which owns APP_DIR. This script runs as
# root and hands every step that touches code from the repository to cbt-web.
# It runs from the root-owned copy /usr/local/sbin/cbt-deploy, which GitHub Actions starts by
# logging in as cbt-ci (a key that can only run `sudo cbt-deploy`) and passing the run's
# read-only GITHUB_TOKEN on stdin. See DEPLOY.md.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/cbt-client/cbt}"
APP_USER="${APP_USER:-cbt-web}"
REPO_URL="${REPO_URL:-https://github.com/amjedabojedi/cbt.git}"
BRANCH="${BRANCH:-main}"
PM2_NAME="${PM2_NAME:-cbt-backend}"
PORT="${PORT:-5005}"
SITE_URL="${SITE_URL:-https://rsehub.ca}"
ALLOW_INSTALL_SCRIPTS="${ALLOW_INSTALL_SCRIPTS:-}"
LOCK_FILE="${LOCK_FILE:-/run/lock/cbt-deploy.lock}"
SELF="${BASH_SOURCE[0]:-}"

# Refuses a checkout carrying the worm force-pushed to our GitHub repos on 2026-11-02
# (an api.js loader, "node api.js" in package.json scripts, code hidden after a run of
# tabs in *.config.js) or other common supply-chain implants. It runs before anything from
# the new checkout is copied into APP_DIR or executed.
# After reviewing a dependency's install script, add it to the allowlist below and update the
# server's copy (see DEPLOY.md).
check_source_tree() {
  local src="$1" problems="" f len run node_out
  # Payload markers and C2 hosts; the brackets keep this file from matching itself.
  local sig='rmcej%ot[b]%|8-1638-[2]|Cot%3t=sht[P]|/0x/cl[s]|M260630[A]|q4FZkx[X]|npm-ws-runne[r]|95\.135\.181\.15[1]|193\.32\.204\.19[9]|166\.88\.73\.4[6]|166\.88\.134\.6[2]'
  flag() { problems="${problems}  - $*"$'\n'; }

  while IFS= read -r f; do flag "unexpected loader file ${f#"$src"/}"; done \
    < <(find "$src" -path "$src/.git" -prune -o -type f -name api.js -print)
  while IFS= read -r f; do flag "known malware marker in ${f#"$src"/}"; done \
    < <(grep -rIlE "$sig" "$src" --exclude-dir=.git || true)
  while IFS= read -r f; do
    len=$(awk '{ if (length > m) m = length } END { print m + 0 }' "$f")
    run=$( (grep -oE '[[:blank:]]+' "$f" || true) | awk '{ if (length > m) m = length } END { print m + 0 }')
    if [ "$len" -gt 400 ] || [ "$run" -ge 60 ]; then
      flag "${f#"$src"/} hides code (longest line ${len}, longest blank run ${run})"
    fi
  done < <(find "$src" -path "$src/.git" -prune -o -type f \( -name '*.config.js' -o -name '*.config.mjs' \
             -o -name '*.config.cjs' -o -name '*.config.ts' -o -name '.eslintrc*' \) -print)
  while IFS= read -r f; do
    if grep -q folderOpen "$f"; then flag "${f#"$src"/} runs a task when the folder is opened"; fi
  done < <(find "$src" -path "$src/.git" -prune -o -path '*/.vscode/tasks.json' -print)
  while IFS= read -r f; do
    if grep -Iq . "$f"; then flag "${f#"$src"/} is a font file that contains text"; fi
  done < <(find "$src" -path "$src/.git" -prune -o -type f \( -iname '*.woff' -o -iname '*.woff2' \
             -o -iname '*.ttf' -o -iname '*.otf' -o -iname '*.eot' \) -print)

  # Scripts this deploy runs, and dependencies npm ci would fetch or execute.
  node_out=$(SRC="$src" ALLOW="${ALLOW_INSTALL_SCRIPTS:-}" node <<'NODE'
const fs = require("fs");
const path = require("path");
const read = (f) => JSON.parse(fs.readFileSync(path.join(process.env.SRC, f), "utf8"));
const out = [];
const pkg = read("package.json");
const scripts = pkg.scripts || {};
// The deploy runs npm ci and npm run build; PM2 runs dist/index.js itself, not npm start.
// A command word, not an option value such as the --platform=node given to esbuild.
const runs = /(?:^|&&|\|\||;|\|)\s*(?:\w+=\S*\s+)*(?:node|bun|curl|wget)\b|api\.js|\|\s*(?:ba)?sh\b/;
for (const name of ["preinstall", "install", "postinstall", "prepare", "prebuild", "build", "postbuild"]) {
  const cmd = scripts[name];
  if (cmd && runs.test(cmd)) {
    out.push(`package.json script "${name}" runs: ${cmd}`);
  }
}
for (const [name, cmd] of Object.entries(scripts)) {
  if (/api\.js/.test(cmd)) out.push(`package.json script "${name}" runs: ${cmd}`);
}
// Install scripts already in the lockfile on 2026-11-03, each reviewed.
const allowed = new Set(["", "esbuild", "bcrypt", "bufferutil", "core-js", "es5-ext", "fsevents",
  ...process.env.ALLOW.split(/[\s,]+/).filter(Boolean)]);
for (const [key, p] of Object.entries(read("package-lock.json").packages || {})) {
  const name = key.split("node_modules/").pop();
  if (p.resolved && !p.resolved.startsWith("https://registry.npmjs.org/")) {
    out.push(`package-lock.json: ${name} is fetched from ${p.resolved}`);
  }
  if (p.hasInstallScript && !allowed.has(name)) {
    out.push(`package-lock.json: ${name}@${p.version} runs an install script (review it, then add "${name}" to the allowlist in scripts/deploy-production.sh and update the server copy; see DEPLOY.md)`);
  }
}
if (out.length) console.log(out.join("\n"));
NODE
  ) || node_out="could not read package.json or package-lock.json"
  if [ -n "$node_out" ]; then
    while IFS= read -r f; do flag "$f"; done <<< "$node_out"
  fi

  if [ -n "$problems" ]; then
    printf '\n!! Refusing to deploy %s: the checkout looks infected.\n%s' \
      "$(git -C "$src" log -1 --format='%h' 2>/dev/null)" "$problems" >&2
    printf '!! Nothing was copied into %s and the running site is unchanged. Inspect %s.\n' "$APP_DIR" "$src" >&2
    return 1
  fi
  echo "Malware check passed"
}

# Fetches, checks, installs, builds and restarts the site. Runs as APP_USER, so code from the
# repository and its dependencies get that account's rights and nothing more.
deploy_as_app() {
  local src="${HOME}/deploy/src" token="" header=""
  # The GitHub token arrives on stdin (see main); nothing after this reads stdin.
  IFS= read -r token || true
  exec </dev/null
  # npx may only run packages installed from the lockfile, never download one.
  export npm_config_yes=false

  rm -rf "$src"
  mkdir -p "$(dirname "$src")"
  if [ -n "$token" ]; then
    # Through the environment, not the command line, so other accounts can't see it in ps;
    # git does not save it in the clone.
    header="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$token" | base64 -w0)"
    GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="http.https://github.com/.extraheader" GIT_CONFIG_VALUE_0="$header" \
      git clone --quiet --depth 1 --no-recurse-submodules --branch "${BRANCH}" "${REPO_URL}" "$src"
  else
    git clone --quiet --depth 1 --no-recurse-submodules --branch "${BRANCH}" "${REPO_URL}" "$src"
  fi
  token="" header=""
  echo "==> Checking $(git -C "$src" log -1 --format='%h "%s" by %an') for malware"
  check_source_tree "$src"

  # The build output in dist/ is what nginx serves and PM2 runs, so it is rebuilt in place.
  rsync -a --delete \
    --exclude '/.env' \
    --exclude '/node_modules/' \
    --exclude '/dist/' \
    --exclude '/.git/' \
    "$src/" "${APP_DIR}/"
  rm -rf "${APP_DIR}/.git"
  cp -a "$src/.git" "${APP_DIR}/.git"

  cd "${APP_DIR}"
  npm ci --legacy-peer-deps --include=dev --no-audit --no-fund
  npm run build
  test -f dist/index.js
  pm2 restart "${PM2_NAME}"
  pm2 save
  sleep 5

  curl -fsS -o /dev/null -w "local :${PORT}/api/health %{http_code}\n" "http://127.0.0.1:${PORT}/api/health"
  if [ -n "${SITE_URL}" ]; then
    # Through this server's nginx, not whatever the DNS answers from here.
    curl -fsS -o /dev/null -w "${SITE_URL} %{http_code}\n" \
      --resolve "${SITE_URL#https://}:443:127.0.0.1" "${SITE_URL}/"
  fi
  echo "Deployed $(git log -1 --format='%h %s')"
}

# Runs one of the functions above as APP_USER, using this file's copy of them. Its stdin is
# passed on, so the token never appears in a command line.
as_app() {
  (cd / && sudo -n -u "${APP_USER}" -H bash -c "set -euo pipefail
$(declare -p APP_DIR REPO_URL BRANCH PM2_NAME PORT SITE_URL ALLOW_INSTALL_SCRIPTS)
$(declare -f check_source_tree deploy_as_app)
$1")
}

main() {
  refuse() { printf '!! %s\n' "$*" >&2; exit 1; }
  [ "$(id -u)" -eq 0 ] || refuse "Run this as root: sudo cbt-deploy"
  # Anything root runs must be out of the app's reach, or a break-in through the app could
  # edit it and gain root on the next deploy.
  if [ -n "$SELF" ] && [ -f "$SELF" ]; then
    case "$(readlink -f "$SELF")" in
      "$(readlink -f "${APP_DIR}")"/*)
        refuse "Not running the copy in ${APP_DIR}, which ${APP_USER} can edit. Run sudo cbt-deploy (see DEPLOY.md)." ;;
    esac
    [ "$(stat -c %U "$SELF")" = root ] || refuse "${SELF} is not owned by root; run sudo cbt-deploy instead."
  fi
  id "${APP_USER}" >/dev/null 2>&1 || refuse "The account ${APP_USER} does not exist (see DEPLOY.md)."

  # The repository is private and the server keeps no GitHub credential of its own, so GitHub
  # Actions passes its run's read-only GITHUB_TOKEN on stdin. It expires when the run ends.
  local token=""
  if [ ! -t 0 ]; then IFS= read -r -t 10 token || true; fi
  exec </dev/null
  # Only base64-encoded into an HTTP header, never parsed, so any printable value without spaces
  # will do; GitHub changes the token format from time to time.
  if [ -n "$token" ] && { [[ ! "$token" =~ ^[[:graph:]]+$ ]] || [ "${#token}" -lt 20 ] || [ "${#token}" -gt 4096 ]; }; then
    refuse "The GitHub token on stdin is malformed."
  fi
  case "${REPO_URL}" in
    https://github.com/*)
      [ -n "$token" ] || refuse "No GitHub token on stdin. Deploy from GitHub: Actions > CBT Auto Deploy to Production > Run workflow (see DEPLOY.md)." ;;
  esac

  exec 9>"${LOCK_FILE}"
  flock -n 9 || refuse "Another deploy is running."

  echo "==> Deploying ${BRANCH} into ${APP_DIR} as ${APP_USER} ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
  printf '%s\n' "$token" | as_app deploy_as_app
  token=""
  echo "DONE"
}

main "$@"
