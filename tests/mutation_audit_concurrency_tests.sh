#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
KUJO_BIN="${KUJO_BIN:-kujo}"
mkdir -p tests/tmp
fixture_dir="$(mktemp -d tests/tmp/mutation-audit.XXXXXX)"
trap 'rm -rf "$fixture_dir"' EXIT
pids=()
for worker in 1 2 3 4 5 6; do
    "$KUJO_BIN" run tests/fixtures/mutation_audit_writer.kujo -- "$fixture_dir" "$worker" > "$fixture_dir/$worker.log" 2>&1 &
    pids+=("$!")
done
for pid in "${pids[@]}"; do
    if ! wait "$pid"; then cat "$fixture_dir"/*.log >&2; exit 1; fi
done
node --input-type=module - "$fixture_dir/dispatch-mutations.jsonl" <<'NODE'
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const rows = readFileSync(process.argv[2], "utf8").trim().split("\n").map(JSON.parse);
const keys = rows.map(({ operation, mutations: [{ worker, sequence }] }) => {
    assert.equal(operation, "audit_fixture");
    return `${worker}:${sequence}`;
});
assert.equal(keys.length, 150);
assert.equal(new Set(keys).size, 150);
console.log("Shared mutation audit retained all 150 records from six writers.");
NODE
