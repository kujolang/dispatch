#!/usr/bin/env bash
set -euo pipefail
# Build tools are maintenance dependencies, never part of participant authority.
cd "$(dirname "$0")/.."
build_env="${SDK_BUILD_ENV:-$PWD/.ci/participant-sdk-build}"
if [[ ! -x "$build_env/bin/python" ]]; then python3 -m venv "$build_env"; fi
"$build_env/bin/python" -m pip install --only-binary=:all: --require-hashes -r packages/participant-sdk-python/build-requirements.lock
export SDK_BUILD_PYTHON="$build_env/bin/python"
mkdir -p .ci/participant-packages
python3 tests/participant_packages.py > .ci/participant-packages/result.json
cat .ci/participant-packages/result.json
ts_config="$(python3 -c 'import json;print(json.load(open(".ci/participant-packages/result.json"))["ts_config"])')"
py_config="$(python3 -c 'import json;print(json.load(open(".ci/participant-packages/result.json"))["python_config"])')"
# Sequential: substitution tests temporarily mutate shared pinned fixture files.
PARTICIPANT_PACKAGE_CONFIG="$ts_config" node tests/typescript_integration.mjs before_commit > .ci/participant-packages/typescript-before.json
PARTICIPANT_PACKAGE_CONFIG="$ts_config" node tests/typescript_integration.mjs after_commit > .ci/participant-packages/typescript-after.json
PARTICIPANT_PACKAGE_CONFIG="$py_config" python3 tests/python_integration.py > .ci/participant-packages/python.json
printf '%s\n' 'Installed package conformance and real crash/replay/contention passed.'
