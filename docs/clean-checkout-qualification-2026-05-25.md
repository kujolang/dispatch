# Clean Checkout Qualification Run

Date: 2026-05-25 02:22:00 UTC
Source commit: cce4575
Method: Fresh clone to temporary directory (`mktemp -d`), then full command validation with pinned runtime.
Runtime: ./kujo

## Summary

All qualification commands exited 0 from a clean checkout.

Note: Interpreter-mode commands continue to emit KUJORUN001 type-check warnings in stderr. These warnings are currently non-fatal and expected in this runtime, and command success is validated by exit code + output signals.

## Command Matrix

| Command | Exit | Signal Observed |
|---|---:|---|
| `kujo run main.kujo --interpreter version` | 0 | Printed `Evalv2.0.0` and contract version |
| `kujo run main.kujo --interpreter list-checks` | 0 | Printed check list with `Total: 27 check types` |
| `kujo run main.kujo --interpreter run examples/release_gate_suite.json --output-dir .eval_clean --json` | 0 | JSON envelope included `"ok":true` |
| `kujo run main.kujo --interpreter report examples/release_gate_suite.json --rerun --output-dir .eval_clean --json` | 0 | JSON envelope included `"ok":true` |
| `kujo test` | 0 | Passed 7/7 test suites |
| `kujo test --runtime interpreter` | 0 | Passed 7/7 test suites |
| `bash scripts/verify_test_runtime_parity.sh` | 0 | Parity script confirmed dual/interpreter 7/7 alignment |
| `bash scripts/verify_docs_command_parity.sh` | 0 | README command parity checks succeeded |
| `bash scripts/release_quality_gates.sh` | 0 | All 11 release gates passed |
| `bash scripts/supply_chain_policy_check.sh` | 0 | Policy checks passed (9/9) |

## Qualification Verdict

PASS: Clean-checkout qualification succeeded for the current release candidate commit.
