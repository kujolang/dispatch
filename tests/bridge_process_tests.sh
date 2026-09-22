#!/usr/bin/env bash
set -euo pipefail
stage=setup

cd "$(dirname "$0")/.."
KUJO_BIN="${KUJO_BIN:-kujo}"
AI_SDK_PATH="${AI_SDK_PATH:-$PWD/../ai-sdk}"
[[ -f "$AI_SDK_PATH/src/ai_sdk.kujo" ]]

mkdir -p tests/tmp
fixture_dir="$(mktemp -d tests/tmp/bridge-package.XXXXXX)"
trap 'result=$?; if [[ "$result" -ne 0 ]]; then echo "Bridge package test failed at stage: $stage" >&2; fi; rm -rf "$fixture_dir"' EXIT
fixture_dir="$PWD/$fixture_dir"
install_root="$fixture_dir/package"
mkdir -p "$install_root" "$fixture_dir/work"
cp -R src examples "$install_root/"
cp dispatch.kujo kennel.toml kujo.toml "$install_root/"
mkdir -p "$install_root/tests/fixtures"
cp tests/fixtures/bridge_error_probe.kujo tests/fixtures/bridge_resolve_probe.kujo \
	tests/fixtures/secret_bridge_error.kujo "$install_root/tests/fixtures/"

cd "$fixture_dir/work"
run_installed() {
	(
		cd "$install_root"
		DISPATCH_ROOT="$install_root" AI_SDK_PATH="$AI_SDK_PATH" \
			DISPATCH_SDK_BRIDGE_SCRIPT="$install_root/bridge_chat.kujo" \
			"$KUJO_BIN" run dispatch.kujo -- "$@"
	)
}
version="$(run_installed version)"
[[ "$version" == "Dispatch 1.3.0" ]]
stage=reject_arbitrary_absolute_path
if run_installed validate --workflow-file "$fixture_dir/work/outside.json" --json \
	>"$fixture_dir/outside.log" 2>&1; then
	echo "An arbitrary absolute workflow path unexpectedly passed." >&2
	exit 1
fi
grep -q 'Absolute config paths are blocked' "$fixture_dir/outside.log"
stage=reject_traversal_paths
for unsafe_name in '../outside.json' 'encoded%2foutside.json'; do
	if run_installed validate --workflow-file "$install_root/examples/workflows/$unsafe_name" --json \
		>"$fixture_dir/traversal.log" 2>&1; then
		echo "A bundled workflow traversal unexpectedly passed." >&2
		exit 1
	fi
	grep -q 'Absolute config paths are blocked' "$fixture_dir/traversal.log"
done

stage=validate_bundled_workflow
run_installed validate --workflow-file "$install_root/examples/workflows/routed-review.json" --json \
	>"$fixture_dir/installed-validate.json"

stage=resolve_pinned_bridge_path
(
	cd "$install_root"
	DISPATCH_ROOT="$install_root" AI_SDK_PATH="$AI_SDK_PATH" \
		DISPATCH_SDK_BRIDGE_SCRIPT="$install_root/bridge_chat.kujo" \
		"$KUJO_BIN" run tests/fixtures/bridge_resolve_probe.kujo
)

stage=run_bundled_demo
if ! DISPATCH_OFFLINE_FIXTURE=true run_installed demo "Bridge package smoke" \
	--workflow-file "$install_root/examples/workflows/routed-review.json" \
	--yes --non-interactive --output-root package-output >"$fixture_dir/demo.log" 2>&1; then
	tail -n 25 "$fixture_dir/demo.log" >&2
	exit 1
fi
grep -q 'Status: completed' "$fixture_dir/demo.log"

stage=reject_custom_provider_origin
payload='{"provider_id":"custom","base_url":"https://unapproved.example/v1","api_key_env":"CUSTOM_API_KEY","messages":[{"role":"user","content":"dispatch-fixture-secret"}]}'
if DISPATCH_ALLOWED_CUSTOM_PROVIDER_ORIGINS=https://models.example/v1 \
	DISPATCH_BRIDGE_PAYLOAD="$payload" /usr/bin/env -C "$AI_SDK_PATH" "$KUJO_BIN" \
	run "$install_root/src/bridge/bridge_chat.kujo" --interpreter >"$fixture_dir/rejected.json" 2>"$fixture_dir/rejected.err"; then
	echo "Unapproved provider unexpectedly passed the bridge." >&2
	exit 1
fi
grep -q '"code":"provider_endpoint_not_allowed"' "$fixture_dir/rejected.json"
if grep -q 'dispatch-fixture-secret' "$fixture_dir/rejected.json" "$fixture_dir/rejected.err"; then
	echo "Bridge rejection leaked request content." >&2
	exit 1
fi

stage=redact_bridge_execution_failure
(
	cd "$install_root"
	DISPATCH_ROOT="$install_root" AI_SDK_PATH="$AI_SDK_PATH" KUJO_BIN="$KUJO_BIN" \
		DISPATCH_SDK_BRIDGE_SCRIPT="$install_root/tests/fixtures/secret_bridge_error.kujo" \
		"$KUJO_BIN" run tests/fixtures/bridge_error_probe.kujo >"$fixture_dir/redaction.log"
)
grep -q 'Bridge execution errors remain redacted' "$fixture_dir/redaction.log"

echo "Isolated bridge package smoke passed."
