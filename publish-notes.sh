#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
export HALOMOON_LOCAL_DEPLOY=1
node scripts/manage-notes.mjs sync
node scripts/publish-local.mjs
