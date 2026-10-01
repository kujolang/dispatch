# Validation commands

All Dispatch commands run from dispatch-resource-accounting with
KUJO_BIN=/Users/robertdevore/2026/Kujolang/validation/graph-attempt-accounting/kujo-verified
and DISPATCH_OFFLINE_FIXTURE=true. No live model provider is called.

Baseline (before implementation):
- kujo-verified run tests/graph_attempt_contract_tests.kujo (19)
- kujo-verified run tests/static_policy_contract_tests.kujo (14)
- kujo-verified run tests/heterogeneous_contract_tests.kujo (10)
- kujo-verified run tests/node_contract_tests.kujo (12)
- node tests/graph_attempt_smoke.mjs (9)
- node tests/graph_attempt_policy.mjs (3)
- node tests/graph_attempt_authority.mjs (3)

Focused final commands:
- kujo-verified run tests/resource_contract_tests.kujo
- kujo-verified run tests/resource_limits_tests.kujo
- node tests/resource_integration.mjs
- node tests/resource_policy.mjs
- node tests/resource_recovery.mjs

Dependencies:
- npm --prefix interop/typescript-participant ci --ignore-scripts
- bash interop/python-participant/bootstrap.sh

Canonical command:
- KUJO_BIN=<above> DISPATCH_OFFLINE_FIXTURE=true bash scripts/run_release_gate.sh

Kujo isolated docs checkout (source e65bb57):
- cargo fmt --check
- cargo build --release --locked
- cargo test --release --locked --test architecture_docs_contract --test workflow_control_contracts --test readme_contracts

Development logs retain failures and corrections. Status is recorded separately;
listing a command here does not claim it passed.

Additional prerequisite and correction checks:
- bash tests/ci_graph_layout_tests.sh (5 checks)
- Ruby YAML.load_file for .github/workflows/ci-gate.yml and .github/workflows/release-artifacts.yml
- node tests/static_policy_recovery.mjs (9 proof groups)
- node tests/node_composition_recovery.mjs (5 proof groups)
- node tests/graph_attempt_binding_safety.mjs (2 proof groups)
- node tests/graph_attempt_recovery.mjs (14 proof groups)
- node tests/heterogeneous_recovery.mjs (8 proof groups)

The first canonical invocation failed at an isolated fixture-copy omission. The five
copy sites were corrected and all 38 focused proof groups passed before a complete
canonical restart. canonical-1.log and failed-canonical-1-suites.log preserve the
original failure; canonical-2.log is the independent full rerun.

Dispatch canonical rerun source: 2577c60ff7ef79992f34b4627799f488cf5edcd6.
Kujo docs/build source: 51369e42b38efb4479af440c8370ac8a4fea3a7a.
Hosted GitHub Actions was not executed as part of these local checks.
