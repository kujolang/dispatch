#!/usr/bin/env bash
set -euo pipefail

KUJO_BIN="${KUJO_BIN:-kujo}"
evidence_dir="${DISPATCH_SMOKE_EVIDENCE_DIR:-tests/tmp/vm-smoke}"
mkdir -p "$evidence_dir"
if "$KUJO_BIN" run dispatch.kujo demo "CI warning-free smoke" --yes --non-interactive \
	--output-root "$evidence_dir/outputs" >"$evidence_dir/stdout.log" 2>"$evidence_dir/stderr.log"; then
	if [[ ! -s "$evidence_dir/stderr.log" ]]; then
		echo "Dispatch VM smoke passed. Evidence: $evidence_dir"
		exit 0
	fi
	echo "Default VM run path emitted stderr output." >&2
else
	result=$?
	echo "Default VM run path failed (exit $result). Evidence: $evidence_dir" >&2
	cat "$evidence_dir/stdout.log" "$evidence_dir/stderr.log" >&2
	exit "$result"
fi
cat "$evidence_dir/stderr.log" >&2
exit 1
