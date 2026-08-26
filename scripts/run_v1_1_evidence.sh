#!/usr/bin/env bash
set -euo pipefail

KUJO_BIN="${KUJO_BIN:-kujo}"
SOAK_RUNS="${DISPATCH_SOAK_RUNS:-5}"
EVIDENCE_DIR="${DISPATCH_EVIDENCE_DIR:-tests/tmp/v1.1-evidence}"

if [[ ! "$SOAK_RUNS" =~ ^[1-9][0-9]*$ ]] || [[ "$SOAK_RUNS" -gt 100 ]]; then
	echo "DISPATCH_SOAK_RUNS must be an integer between 1 and 100." >&2
	exit 1
fi

mkdir -p "$EVIDENCE_DIR"
started_epoch="$(date +%s)"

DISPATCH_OFFLINE_FIXTURE=true "$KUJO_BIN" run dispatch.kujo -- validate \
	--workflow-file examples/workflows/routed-review.json --json \
	> "$EVIDENCE_DIR/validate.json"
DISPATCH_OFFLINE_FIXTURE=true "$KUJO_BIN" run dispatch.kujo -- explain-route \
	--workflow-file examples/workflows/routed-review.json --json \
	> "$EVIDENCE_DIR/explain-route.json"

"$KUJO_BIN" run dispatch.kujo -- init --dir "$EVIDENCE_DIR/starter" --force \
	> "$EVIDENCE_DIR/init.txt"
"$KUJO_BIN" run dispatch.kujo -- catalog sync \
	examples/dispatch-model-catalog.config.json \
	--output "$EVIDENCE_DIR/generated-catalog.json" \
	> "$EVIDENCE_DIR/catalog.txt"

completed=0
index=1
while [[ "$index" -le "$SOAK_RUNS" ]]; do
	output_root="$EVIDENCE_DIR/soak-$index"
	DISPATCH_OFFLINE_FIXTURE=true "$KUJO_BIN" run dispatch.kujo -- demo \
		"Release evidence run $index" \
		--workflow-file examples/workflows/routed-review.json \
		--yes --non-interactive --output-root "$output_root" \
		> "$EVIDENCE_DIR/soak-$index.txt"
	if ! grep -q 'Status: completed' "$EVIDENCE_DIR/soak-$index.txt"; then
		echo "Soak run $index did not complete." >&2
		exit 1
	fi
	completed=$((completed + 1))
	index=$((index + 1))
done

finished_epoch="$(date +%s)"
duration_seconds=$((finished_epoch - started_epoch))
commit_sha="$(git rev-parse HEAD)"
printf '{"schema_version":"1.0","dispatch_commit":"%s","fixture":true,"requested_runs":%s,"completed_runs":%s,"duration_seconds":%s,"generated_at_epoch":%s}\n' \
	"$commit_sha" "$SOAK_RUNS" "$completed" "$duration_seconds" "$finished_epoch" \
	> "$EVIDENCE_DIR/evidence.json"

echo "Dispatch v1.1 evidence passed: $completed/$SOAK_RUNS runs in ${duration_seconds}s"
echo "Evidence: $EVIDENCE_DIR/evidence.json"
