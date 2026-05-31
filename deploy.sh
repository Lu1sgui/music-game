#!/usr/bin/env bash
# deploy.sh — update the production app ON THE SERVER.
#
# Run from the REAL app directory that LiteSpeed serves:
#   cd ~/domains/devinsmusic.reviews/nodejs && bash deploy.sh
#
# IMPORTANT: this shared host (CloudLinux/CageFS) CANNOT run `next build` — the
# Rust/SWC compiler hits the process/thread limit and aborts. So the build is
# done LOCALLY and the compiled `.next/` is committed to git. This script only
# pulls that prebuilt output, syncs the DB schema, and restarts. Never run
# `next build` here.
#
# Local release flow (on your machine), before running this:
#   npm run build && git add -A && git commit && git push   # commits .next/
set -euo pipefail

echo "▶ [server] Fetching latest main (includes the prebuilt .next/)..."
git fetch origin main
git reset --hard origin/main

# Only reinstall when the lockfile actually changed (npm ci is unnecessary churn
# otherwise). This does NOT build native code, so it's safe on this host.
if ! git diff --quiet HEAD@{1} HEAD -- package-lock.json 2>/dev/null; then
  echo "▶ [server] package-lock.json changed — installing dependencies..."
  npm ci --no-audit --no-fund
else
  echo "▶ [server] Dependencies unchanged — skipping npm ci."
fi

echo "▶ [server] Generating Prisma client..."
npx prisma generate

echo "▶ [server] Syncing database schema..."
# `prisma db push` needs a DIRECT/session connection. The app's DATABASE_URL
# points at Supabase's TRANSACTION pooler (port 6543, pgbouncer=true), which
# does NOT support DDL and will hang. Derive a session-pooler URL (port 5432,
# no pgbouncer) just for this command. The .env is left untouched.
set -a; source .env; set +a
MIGRATE_URL="${DATABASE_URL/6543/5432}"
MIGRATE_URL="${MIGRATE_URL/&pgbouncer=true/}"
DATABASE_URL="$MIGRATE_URL" npx prisma db push

echo "▶ [server] Restarting the LiteSpeed Node app..."
mkdir -p tmp
touch tmp/restart.txt

echo "✓ [server] Deploy complete. Verify https://devinsmusic.reviews"
