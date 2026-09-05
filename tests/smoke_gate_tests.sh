#!/usr/bin/env bash
set -euo pipefail
mkdir -p tests/tmp
fixture_dir="$(mktemp -d tests/tmp/smoke-gate.XXXXXX)"
trap 'rm -rf "$fixture_dir"' EXIT
cat > "$fixture_dir/runtime" <<'RUNTIME'
#!/usr/bin/env bash
if [[ "${FAKE_STDERR:-}" == true ]]; then echo "unexpected diagnostic" >&2; fi
exit "${FAKE_EXIT:-0}"
RUNTIME
chmod +x "$fixture_dir/runtime"
export KUJO_BIN="$PWD/$fixture_dir/runtime"
export DISPATCH_SMOKE_EVIDENCE_DIR="$fixture_dir/evidence"
bash scripts/check_vm_smoke.sh >"$fixture_dir/result" 2>&1
if FAKE_EXIT=23 bash scripts/check_vm_smoke.sh >"$fixture_dir/result" 2>&1; then
	echo "Smoke gate accepted a silent failure." >&2
	exit 1
else
	[[ "$?" == 23 ]]
fi
if FAKE_STDERR=true bash scripts/check_vm_smoke.sh >"$fixture_dir/result" 2>&1; then
	echo "Smoke gate accepted unexpected diagnostics." >&2
	exit 1
fi
grep -q 'unexpected diagnostic' "$DISPATCH_SMOKE_EVIDENCE_DIR/stderr.log"
echo "Smoke gate tests passed (success, silent failure, diagnostics)."
