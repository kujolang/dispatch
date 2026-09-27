#!/usr/bin/env bash
set -euo pipefail
DISPATCH_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ABILITY_ROOT="${ABILITY_ROOT:-$DISPATCH_ROOT/../ability}"
export DISPATCH_ROOT
: "${KUJO_BIN:?Set the reviewed source runtime}"
cd "$ABILITY_ROOT"
bash scripts/verify-application-assurance.sh --dispatch
