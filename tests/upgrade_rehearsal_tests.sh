#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
dispatch_root="$PWD"
KUJO_BIN="${KUJO_BIN:-kujo}"
case "$KUJO_BIN" in /*) ;; *) KUJO_BIN="$(command -v "$KUJO_BIN")" ;; esac

git rev-parse -q --verify 'refs/tags/v1.2.0^{commit}' >/dev/null || {
	echo "Fetch the immutable v1.2.0 tag before the upgrade rehearsal." >&2
	exit 1
}
[[ "$(git rev-parse 'refs/tags/v1.2.0^{commit}')" == 662417c264bd55f8d802eef3fc21f9f372590753 ]] || {
	echo "The v1.2.0 tag no longer resolves to its reviewed release commit." >&2
	exit 1
}
mkdir -p tests/tmp
evidence_dir="$(mktemp -d "$dispatch_root/tests/tmp/upgrade-rehearsal.XXXXXX")"
echo "Upgrade evidence: $evidence_dir"
mkdir -p "$evidence_dir/v1.2"
git archive v1.2.0 | tar -xf - -C "$evidence_dir/v1.2"

for backend in filesystem sqlite; do
	root="$evidence_dir/v1.2/tests/tmp/$backend-runs"
	(
		cd "$evidence_dir/v1.2"
		DISPATCH_STATE_BACKEND="$backend" DISPATCH_OFFLINE_FIXTURE=true "$KUJO_BIN" \
			run dispatch.kujo demo "Legacy $backend upgrade" --non-interactive \
			--decision changes --output-root "tests/tmp/$backend-runs" \
			>"$evidence_dir/$backend-create.log"
	)
	state_file="$(find "$root" -mindepth 2 -maxdepth 2 -name state.json -print -quit)"
	[[ -n "$state_file" ]]
	run_id="$(basename "$(dirname "$state_file")")"
	[[ "$(jq -r '.status' "$state_file")" == needs_changes ]]
	cp -R "$root" "$evidence_dir/$backend-backup"

	DISPATCH_STATE_BACKEND="$backend" DISPATCH_OFFLINE_FIXTURE=true \
		DISPATCH_ALLOW_ANY_OUTPUT_ROOT=true "$KUJO_BIN" run dispatch.kujo resume \
		"$run_id" --yes --non-interactive --output-root "$root" \
		>"$evidence_dir/$backend-upgraded.log"
	[[ "$(jq -r '.status' "$state_file")" == completed ]]
	[[ -f "$root/$run_id/.dispatch-run.lock" ]]

	# Roll back from the quiesced pre-upgrade backup, never from new-format state.
	cp -R "$evidence_dir/$backend-backup" "$evidence_dir/$backend-rollback"
	(
		cd "$evidence_dir/v1.2"
		DISPATCH_STATE_BACKEND="$backend" DISPATCH_OFFLINE_FIXTURE=true \
			DISPATCH_ALLOW_ANY_OUTPUT_ROOT=true "$KUJO_BIN" run dispatch.kujo \
			resume "$run_id" --yes --non-interactive \
			--output-root "$evidence_dir/$backend-rollback" \
			>"$evidence_dir/$backend-rollback.log"
	)
	[[ "$(jq -r '.status' "$evidence_dir/$backend-rollback/$run_id/state.json")" == completed ]]
	[[ "$(jq -r '.status' "$state_file")" == completed ]]
	echo "Quiesced v1.2 -> v1.3 resume and backup rollback passed: $backend"
done
