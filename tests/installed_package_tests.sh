#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Exercise the installer-provided closure, not a caller's source-tree overrides.
unset DISPATCH_ROOT DISPATCH_SDK_BRIDGE_SCRIPT AI_SDK_PATH

[[ "$#" == 1 ]] || { echo "Usage: $0 <isolated-installer-prefix>" >&2; exit 2; }
prefix="${1%/}"
[[ "$prefix" == /* ]] || { echo "Installer prefix must be absolute." >&2; exit 2; }
package_root="$prefix/sources/dispatch"
ai_sdk_root="$prefix/sources/ai-sdk"
kujo_bin="$(dirname "$prefix")/bin/kujo"
dispatch_bin="$(dirname "$prefix")/bin/dispatch"
[[ -f "$package_root/dispatch.kujo" && -f "$ai_sdk_root/src/ai_sdk.kujo" ]]
[[ -x "$kujo_bin" && -x "$dispatch_bin" ]]
[[ "$(<"$package_root/.kujo-install-ref")" == "$(git rev-parse HEAD)" ]]
[[ "$(<"$prefix/sources/kujo/.kujo-install-ref")" == 266a8902068a14c3d17f803bef467dc28f1fe162 ]]

mkdir -p tests/tmp
evidence_dir="$(mktemp -d "$PWD/tests/tmp/installed-package.XXXXXX")"
mkdir -p "$evidence_dir/work"
echo "Installed-package evidence: $evidence_dir"
(
	cd "$evidence_dir/work"
	[[ "$("$dispatch_bin" version)" == "Dispatch 1.3.0" ]]
	"$dispatch_bin" validate --workflow-file "$package_root/examples/workflows/routed-review.json" --json \
		>"$evidence_dir/validate.json"
	if "$dispatch_bin" validate --workflow-file "$evidence_dir/outside.json" --json \
		>"$evidence_dir/rejected-path.log" 2>&1; then
		echo "Installed shim accepted an arbitrary absolute workflow file." >&2
		exit 1
	fi
	grep -q 'Absolute config paths are blocked' "$evidence_dir/rejected-path.log"
	DISPATCH_OFFLINE_FIXTURE=true "$dispatch_bin" demo "Installed package proof" \
		--workflow-file "$package_root/examples/workflows/routed-review.json" \
		--yes --non-interactive --output-root outputs >"$evidence_dir/demo.log"
	grep -q 'Status: completed' "$evidence_dir/demo.log"
	run_id="$(sed -n 's/^Run ID: //p' "$evidence_dir/demo.log" | head -1)"
	[[ -n "$run_id" ]]
	"$dispatch_bin" inspect "$run_id" --output-root outputs --json >"$evidence_dir/inspect.json"
	grep -q '"status":"completed"' "$evidence_dir/inspect.json"
)

(
	cd "$package_root"
	DISPATCH_ROOT="$package_root" AI_SDK_PATH="$ai_sdk_root" KUJO_BIN="$kujo_bin" \
		DISPATCH_SDK_BRIDGE_SCRIPT="$package_root/bridge_chat.kujo" \
		"$kujo_bin" run tests/fixtures/bridge_resolve_probe.kujo >"$evidence_dir/resolve.log"
	DISPATCH_ROOT="$package_root" AI_SDK_PATH="$ai_sdk_root" KUJO_BIN="$kujo_bin" \
		DISPATCH_SDK_BRIDGE_SCRIPT="$package_root/tests/fixtures/secret_bridge_error.kujo" \
		"$kujo_bin" run tests/fixtures/bridge_error_probe.kujo >"$evidence_dir/redacted.log"
)
grep -q 'Pinned installer bridge path resolved' "$evidence_dir/resolve.log"
grep -q 'Bridge execution errors remain redacted' "$evidence_dir/redacted.log"

payload='{"provider_id":"custom","base_url":"https://unapproved.example/v1","api_key_env":"CUSTOM_API_KEY","messages":[{"role":"user","content":"dispatch-fixture-secret"}]}'
if (
	cd "$ai_sdk_root"
	DISPATCH_ALLOWED_CUSTOM_PROVIDER_ORIGINS=https://models.example/v1 \
		DISPATCH_BRIDGE_PAYLOAD="$payload" "$kujo_bin" run "$package_root/src/bridge/bridge_chat.kujo" --interpreter
) >"$evidence_dir/origin.json" 2>"$evidence_dir/origin.stderr"; then
	echo "Installed bridge accepted an unapproved custom-provider origin." >&2
	exit 1
fi
grep -q '"code":"provider_endpoint_not_allowed"' "$evidence_dir/origin.json"
if grep -q 'dispatch-fixture-secret' "$evidence_dir/origin.json" "$evidence_dir/origin.stderr"; then
	echo "Installed bridge leaked request content on origin rejection." >&2
	exit 1
fi

echo "Pinned clean installation, external-cwd shim, bundled workflow, bridge origin, and redaction passed."
