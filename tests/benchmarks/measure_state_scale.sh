#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."
KUJO_BIN="${KUJO_BIN:-kujo}"
mkdir -p tests/tmp
result_dir="$(mktemp -d tests/tmp/state-scale.XXXXXX)"
echo "Local benchmark evidence: $result_dir"

for scenario in small large; do
	if [[ "$scenario" == small ]]; then runs=5; payload_chars=128; else runs=50; payload_chars=262144; fi
	for sample in 1 2 3; do
		output_root="$result_dir/$scenario-$sample"
		if [[ "$(uname)" == Darwin ]]; then
			/usr/bin/time -l "$KUJO_BIN" run tests/benchmarks/state_catalog_scale.kujo -- \
				"$runs" "$payload_chars" "$output_root" >"$result_dir/$scenario-$sample.json" \
				2>"$result_dir/$scenario-$sample.time"
			peak="$(awk '/maximum resident set size/ {print $1; exit}' "$result_dir/$scenario-$sample.time")"
			unit=bytes
		else
			/usr/bin/time -v "$KUJO_BIN" run tests/benchmarks/state_catalog_scale.kujo -- \
				"$runs" "$payload_chars" "$output_root" >"$result_dir/$scenario-$sample.json" \
				2>"$result_dir/$scenario-$sample.time"
			peak="$(awk -F: '/Maximum resident set size/ {gsub(/ /, "", $2); print $2; exit}' "$result_dir/$scenario-$sample.time")"
			unit=KiB
		fi
		[[ -n "$peak" ]]
		echo "$scenario sample=$sample peak_rss_$unit=$peak $(tail -n 1 "$result_dir/$scenario-$sample.json")"
	done
done
