# Dispatch Release Checklist

Use this checklist for every tagged release.

## Scope

- Repository: `kujolang/dispatch`
- Version source of truth: `kennel.toml` -> `[package].version`
- Changelog source of truth: `CHANGELOG.md`

## 1. Prepare Release Contents

1. Confirm target version bump type (major/minor/patch) against policy in `CHANGELOG.md`.
2. Ensure all user-visible changes are represented under `## [Unreleased]` with appropriate headings.
3. Verify breaking changes are explicitly documented.
4. Validate docs parity for updated CLI/flags in `README.md`.
5. Confirm `docs/dispatch-next-session-checklist-v2.md` has no remaining unchecked backlog items.

## 2. Run Validation Gate

Set runtime environment:

```bash
pushd "$(git rev-parse --show-toplevel)"
export KUJO_BIN=/path/to/kujo
export DISPATCH_OFFLINE_FIXTURE=true
```

Run release gate commands:

```bash
$KUJO_BIN test-run tests/sdk_adapter_tests.kujo -v
$KUJO_BIN test-run tests/policy_precedence_tests.kujo -v
$KUJO_BIN test-run tests/dispatch_tests.kujo -v
```

Run a command-surface smoke check:

```bash
$KUJO_BIN run dispatch.kujo --help
popd
```

## 3. Verify Artifact Behavior

Run a fixture-mode demo and check artifacts:

```bash
$KUJO_BIN run dispatch.kujo demo "Release checklist smoke" --yes --non-interactive --decision approve --output-root tests/tmp/release-smoke-outputs
```

Confirm expected outputs exist for the generated run:

- `state.json`
- `trace.json`
- `trace.md`
- `report.md`
- `report.json`

Confirm persisted artifact contract metadata exists in machine-readable artifacts:

- `state.json`: `artifact_contract_version`, `schema_name`, `schema_version`
- `trace.json`: `artifact_contract_version`, `schema_name`, `schema_version`
- `report.json`: `artifact_contract_version`, `schema_name`, `schema_version`

Confirm machine-readable command surfaces are stable:

```bash
$KUJO_BIN run dispatch.kujo show <run-id> --output-root tests/tmp/release-smoke-outputs --json
$KUJO_BIN run dispatch.kujo inspect <run-id> --output-root tests/tmp/release-smoke-outputs --json
$KUJO_BIN run dispatch.kujo doctor --output-root tests/tmp/release-smoke-outputs --json
```

## 4. Cut Release

1. Update `kennel.toml` `[package].version` to target version.
2. Move `## [Unreleased]` entries into a new version section in `CHANGELOG.md` with release date.
3. Commit release metadata updates.
4. Tag release with `v<version>`.
5. Push commit and tag.

## 5. Post-Release

1. Create a fresh `## [Unreleased]` section in `CHANGELOG.md`.
2. Verify repository default branch reflects release commit/tag.
3. Record follow-up issues for deferred work discovered during release validation.
