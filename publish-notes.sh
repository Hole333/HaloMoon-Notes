#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
export HALOMOON_LOCAL_DEPLOY=1
set +e
node scripts/manage-notes.mjs sync
SYNC_STATUS=$?
set -e
if [ "$SYNC_STATUS" -ne 0 ]; then
  echo "GitHub sync failed; continuing with local deployment from the local working tree." >&2
fi
node scripts/publish-local.mjs
