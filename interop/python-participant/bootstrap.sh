#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 -I -m venv .venv
.venv/bin/python -I -m pip download --only-binary=:all: --require-hashes -r requirements.lock -d wheelhouse
.venv/bin/python -I -m pip install --no-index --find-links wheelhouse --only-binary=:all: --require-hashes -r requirements.lock
