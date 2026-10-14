#!/usr/bin/env bash
set -euo pipefail
KUJO_BIN="${KUJO_BIN:-kujo}"
probe="$(mktemp -d "${TMPDIR:-/tmp}/dispatch-runtime-contract.XXXXXX")"
trap 'rm -rf "$probe"' EXIT
mkdir "$probe/records"
cat > "$probe/probe.kujo" <<'KUJO'
if sync_directory_beneath(env("DISPATCH_RUNTIME_PROBE_DIR"), "records") != true {
    exit(1)
}
KUJO
if ! DISPATCH_RUNTIME_PROBE_DIR="$probe" "$KUJO_BIN" run "$probe/probe.kujo" > "$probe/output" 2>&1; then
    echo 'Dispatch requires Kujo 1.8.1 with sync_directory_beneath (see release/dispatch-v1.4.0.refs).' >&2
    cat "$probe/output" >&2
    exit 1
fi
echo 'Runtime directory durability contract passed.'
