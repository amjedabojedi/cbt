# Deploying rsehub.ca

Production is the Azure VM Resilience2 (`20.62.161.79`). nginx serves the built frontend from
`/var/www/cbt-client/cbt/dist/public` and proxies `/api` and `/ws` to the Node server on port 5005.

## How a deploy runs

A push to `main` runs `.github/workflows/deploy.yml`. After the build check passes, it logs in as
`cbt-ci`, whose key in the repo secret `CBT_DEPLOY_KEY` can do one thing only: run
`sudo cbt-deploy`. Whatever the workflow sends, the server runs that command and nothing else.

`cbt-deploy` is a root-owned copy of `scripts/deploy-production.sh` in `/usr/local/sbin`. It:

1. clones `main` from GitHub as `cbt-web`. The repository is private and the server keeps no GitHub
   credential of its own, so the workflow passes its run's read-only `GITHUB_TOKEN` on stdin; it
   expires when the run ends;
2. checks the clone for malware (below) and stops if anything looks wrong, leaving the app untouched;
3. copies it into `/var/www/cbt-client/cbt`, then runs `npm ci --legacy-peer-deps` and
   `npm run build` as `cbt-web`, and restarts the app.

To deploy without a push, run the workflow by hand: Actions → CBT Auto Deploy to Production → Run
workflow. It always deploys `main`. Running `sudo cbt-deploy` on the server stops with "No GitHub
token", because the server can't read the private repository by itself. Never run the copy in
`/var/www/cbt-client/cbt`; the script refuses to.

`package-lock.json` is committed, so production installs exactly the versions in it. After adding or
upgrading a package, commit the updated lockfile with it (`npm install --legacy-peer-deps`), or
`npm ci` stops the deploy.

## Accounts on the server

- **`cbt-web`** runs the app. It has no password, can't log in and has no admin rights, so a break-in
  through the app or a bad npm package stays inside that account. It owns `/var/www/cbt-client/cbt`,
  except `.env`. The folder stays readable by others because nginx serves `dist/public` from it.
- **`.env`** belongs to root, is readable by `cbt-web` only and is locked with `chattr +i`, so the app
  can read it but not change or replace it. To edit it:
  `sudo chattr -i /var/www/cbt-client/cbt/.env && sudo nano /var/www/cbt-client/cbt/.env && sudo chattr +i /var/www/cbt-client/cbt/.env`,
  then `sudo -u cbt-web -H pm2 restart cbt-backend`. `VITE_*` values are built into the frontend, so
  they need a deploy instead of a restart.
- **PM2** runs under `cbt-web` and starts on boot through the systemd unit `pm2-cbt-web`:
  `sudo -u cbt-web -H pm2 status`, `sudo -u cbt-web -H pm2 logs cbt-backend`.
- **`cbt-ci`** is the GitHub Actions login. Its only `sudo` right is `/usr/local/sbin/cbt-deploy`.
- The admin accounts must never run a file that `cbt-web` can edit, which is everything in
  `/var/www/cbt-client/cbt`, or a break-in through the app could gain admin rights at the next deploy.
  After changing the deploy script, update the server's copy from a reviewed checkout:
  `ssh <admin>@20.62.161.79 'sudo install -o root -g root -m 755 /dev/stdin /usr/local/sbin/cbt-deploy' < scripts/deploy-production.sh`
- If PM2's saved process list is ever lost, start the app again with:
  `sudo -u cbt-web -H bash -c 'cd /var/www/cbt-client/cbt && pm2 start dist/index.js --name cbt-backend --time && pm2 save'`

## Malware check during deploy

The deploy checks the fresh clone of `main` before copying or running any of it, and stops with
"Refusing to deploy" if it finds signs of the worm force-pushed to our GitHub repos on 2026-11-02 or
of a similar implant:

- an `api.js` file, any `package.json` script that mentions `api.js`, or an install or build script
  that runs `node`, `bun`, `curl`, `wget` or a shell pipe
- code hidden at the end of a `*.config.*` file (a line over 400 characters or a long run of tabs)
- known payload markers or attacker addresses anywhere in the code
- a `.vscode/tasks.json` that runs on folder open, or a font file that contains text
- a dependency fetched from anywhere but registry.npmjs.org, or one with an install script that is not
  on the script's allowlist (esbuild, bcrypt, bufferutil, core-js, es5-ext, fsevents)

The running app is left untouched when it refuses. A new dependency with an install script must be
reviewed and then approved: add it to the allowlist in `scripts/deploy-production.sh` and update the
server's copy as above.

A push can't switch the check off: the server runs its own copy of the script, and the workflow can
only ask for that copy to run.
