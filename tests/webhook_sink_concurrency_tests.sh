#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
KUJO_BIN="${KUJO_BIN:-kujo}"
mkdir -p tests/tmp
fixture_dir="$(mktemp -d tests/tmp/webhook-concurrency.XXXXXX)"
trap 'rm -rf "$fixture_dir"' EXIT
sink_path="$PWD/$fixture_dir/events.jsonl"
pids=()
for worker in 1 2 3 4 5 6; do
	"$KUJO_BIN" run tests/fixtures/webhook_sink_writer.kujo -- "$sink_path" "$worker" 25 \
		>"$fixture_dir/$worker.log" 2>&1 &
	pids+=("$!")
done
for pid in "${pids[@]}"; do wait "$pid"; done
"$KUJO_BIN" run tests/fixtures/webhook_sink_verify.kujo -- "$sink_path" 150
