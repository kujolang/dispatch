#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .ci/participant-distribution
python3 tests/participant_distribution.py > .ci/participant-distribution/result.json
ts_config="$(python3 -c 'import json;print(json.load(open(".ci/participant-distribution/result.json"))["consumer_configs"]["ts"])')"
py_config="$(python3 -c 'import json;print(json.load(open(".ci/participant-distribution/result.json"))["consumer_configs"]["py"])')"
PARTICIPANT_PACKAGE_CONFIG="$ts_config" node tests/typescript_integration.mjs before_commit > .ci/participant-distribution/typescript-before.json
PARTICIPANT_PACKAGE_CONFIG="$ts_config" node tests/typescript_integration.mjs after_commit > .ci/participant-distribution/typescript-after.json
PARTICIPANT_PACKAGE_CONFIG="$py_config" python3 tests/python_integration.py > .ci/participant-distribution/python.json
printf '%s\n' 'Private distribution, offline conformance, crash/replay and contention passed.'
