#!/usr/bin/env bash
# deploy.sh — update the production app on the server.
#
# Run this from the REAL app directory that LiteSpeed serves, e.g.:
#   cd ~/domains/devinsmusic.reviews/nodejs && bash deploy.sh
#
# It pulls the latest main, syncs the database schema, rebuilds, and restarts
# the LiteSpeed Node app (via the tmp/restart.txt touch-file trigger).
set -euo pipefail

echo "▶ Fetching latest main..."
git fetch origin main
git reset --hard origin/main

echo "▶ Installing dependencies (if lockfile changed)..."
npm ci --no-audit --no-fund

echo "▶ Generating Prisma client..."
npx prisma generate

echo "▶ Pushing schema changes to the database..."
# Adds the new Submission.slot column and the unique indexes from this release.
# If this fails on the ChipActivation unique index, you likely have duplicate
# (user_id, cycle_id) activation rows — clean them up first (see PR notes).
npx prisma db push

echo "▶ Building..."
npm run build

echo "▶ Restarting the app..."
mkdir -p tmp
touch tmp/restart.txt

echo "✓ Deploy complete."
