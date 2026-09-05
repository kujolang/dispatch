# Dispatch repository hardening receipt

## Repository and scope

- Repository: `kujolang/dispatch`; branch: `main`.
- Starting SHA: `83ffa0e3c1602ec1058d0455b03fba32a061f636` (clean working tree).
- Ending implementation SHA: `1caefcc696e10bd1d7d287c307a3fb55c6eae2e8`; the documentation-only report commit follows it.
- Audit dates: 2026-09-04–05 America/Detroit (2026-09-05 UTC).
- Purpose: persistent AI workflow orchestration, routing, tool policy, human decisions, reports, and transfer bundles.
- Integrations: Kujo runtime; external AI SDK bridge and model catalog; Agents SDK vocabulary; Leash human intervention events; Watchdog metadata projections; OTLP traces; SQLite state authority; signed webhook delivery.
- No sibling repository was modified. Related runtime implementation and local SDK interfaces were inspected read-only. Generated evidence stays under `tests/tmp/hardening/`.

This is a combined engineering audit, not a certification or a separate hosted security scan. Broad searches excluded `target/`, `outputs/`, `tests/tmp/`, `.ci/`, and `.git/`; focused reproductions explicitly used ignored test directories. Historical checklist references were checked against the actual tracked inventory.

## Baseline

The installed `kujo 1.0.0` is below the declared minimum 1.0.2. Its SDK suite passed, but that initial full-gate attempt was stopped and superseded by supported-runtime verification. No conclusion about supported behavior is drawn from that incomplete attempt.

Local verification used the available Kujo 1.2.3 release executable at `../kujo/target/release/kujo`, SHA-256 `672951e9703c21b0be2adf527c984bbcfec7a8b6107dc479970303d050cd15eb`. The runtime checkout was `06f0900e9d6259b89712c87acc8a9feca452f048`; the binary's build-to-source provenance was not independently established. The local AI SDK checkout was `71bad1468fbc97eab830a27c185c032f07fd76cf`. CI continues to pin Kujo `123542ba17a0ef0150970a6c626b518946ff0bbb` and AI SDK `849dbbbba7a734938320dd9569d1ed7aa6240298`; this local run is not a claim that those exact CI revisions were rebuilt.

An immutable source snapshot was extracted with `git archive` into `tests/tmp/hardening/baseline-repo/` before production edits. The baseline gate runs from that snapshot with explicit runtime/SDK paths. Baseline and final gate outcomes are recorded in the verification section. One intermediate final-gate attempt was invalidated by editing its running shell script; it was restarted from a frozen script copy. That harness interruption is not reported as a product failure. The session later stopped with final shards 1–18 and baseline shards 1–9 complete; on continuation, the still-incomplete shards were restarted from 19 and 10 respectively. The executable hash was reverified unchanged. These are staged full-suite results, not uninterrupted gate-duration measurements.

New behavioral probes against the original implementation reproduced four failures: persisted token-budget corruption, a second model call after exact budget exhaustion, acceptance of stream path separators, and library writes despite output-root rejection. Malformed scalar steps and exact sink framing already passed, so their implementation was preserved.

## Review coverage

| Area / prompt phases | Implementation and contracts reviewed | Disposition |
| --- | --- | --- |
| Structure, complexity, dead weight (0, 2, 16) | CLI/parser/output, workflow loader/templates, agent/tool registries, core state/runner/routing, manifests and tracked inventory | Removed expensive redaction scaffolding; retained public wrappers, explicit fixtures and domain boundaries. No speculative deletion. |
| Runtime and resource work (1, 3, 4) | Persistence/redaction/serialization, index scans, webhook append/outbox, source lookup, retries and subprocess limits | Measured and removed repeated work; retained complete required outputs and existing bounded trace/outbox policies. |
| Agent context and output (5, 6, 15) | `build_step_input`, model messages, declared tool schemas, bounded tool rounds/calls, trace previews, bridge diagnostics, release logs, README/AGENTS | Fixed exhausted budget state; retained necessary model context; concise test receipts now point to full logs. |
| Failure/security boundaries (7, 8) | Config/workflow/bundle limits, output/source/catalog/stream paths, tool authorization, subprocess argv, provider credentials/origins, HMAC bundles, artifact redaction | Fixed library path rejection, stream names and budget corruption; preserved existing security controls. |
| Concurrency/state (9) | Lock creation/recovery/release, atomic artifacts, SQLite revisions/mirrors, index cache, dependency scheduling, idempotent parallel tools, resume definitions | Atomic lock acquisition; stronger SQLite tests; age-based recovery remains an explicit risk. |
| Contracts/dependencies (10, 11) | CLI text/JSON envelopes, v1/v2 migration, package exports, pinned release closure, CI action pins and permissions | No dependency changes or schema/version churn. External SDK owns provider normalization. |
| Tests/CI/docs (12, 13, 14) | Focused suites, 101 sharded contracts, offline soak/catalog/init evidence, benchmark and smoke scripts, README/deployment/benchmark docs | Added behavior and concurrency checks; smoke failures can no longer be hidden; corrected stale documentation. |

## Findings

| ID | Priority | Area | Finding | Evidence | Action | Status |
| -- | -------- | ---- | ------- | -------- | ------ | ------ |
| H01 | P1 | Persistence | `max_total_tokens` matched credential redaction and became a string, invalidating resumed workflow definitions | Baseline regression expected 42, received `[REDACTED]` | Preserve this exact non-secret budget key; verify reload and credential redaction | Fixed |
| H02 | P1 | Budget | A remaining budget of zero disabled the next-round guard | Baseline model stub received an unexpected second call | Track whether the original envelope was bounded independently of remaining capacity | Fixed |
| H03 | P1 | Filesystem | Stream names incorporated arbitrary step path separators | Baseline stub received `../../outside` stream naming; source creates parent directories before writing | Reject separators before invoking the model or writing stream output | Fixed |
| H04 | P1 | Filesystem | `create_run_state` ignored failed output-root validation | Baseline library probe created a forbidden absolute output directory within the test sandbox | Raise `invalid_output_root` before any filesystem mutation | Fixed |
| H05 | P1 | Concurrency | Lock acquisition used `write_file(..., false)`, whose runtime implementation checks existence before writing | Runtime `filesystem.rs` implements a separate existence check; atomic variant already supports no-overwrite hard-link publication in the pinned runtime | Use `write_file_atomic(..., false)`; four-process contention test | Fixed acquisition; recovery risk is H11 |
| H06 | P1 | Performance | Redaction allocated traversal nodes for every primitive leaf; persistence repeated trace redaction and full-state serialization | Equivalent-output redaction workload and persistence source | Queue containers only; reuse the redacted trace and serialized state | Fixed |
| H07 | P1 | I/O | Each sink event read and rewrote all previous events | 1 MiB seed / 200-event workload; exact framing test | Append only new bytes, preserving the established newline behavior | Fixed |
| H08 | P1 | CI | Warning-free smoke swallowed a nonzero process exit when stderr was empty | Original workflow used `|| true`; fake runtime exits 23 silently | Shared smoke script preserves exit status and evidence; behavioral shell regressions | Fixed |
| H09 | P2 | Output / tests | Passing test output was always verbose; throughput benchmark did not fail when runs failed | Gate and benchmark source | Suite receipts with complete logs and opt-in verbosity; unsuccessful throughput exits nonzero | Fixed |
| H10 | P2 | Docs / proof | Missing historical files, contradictory interpreter warning claims, incorrect lock default, missing credential-env control; SQLite authority test did not corrupt the mirror | Tracked-file inventory, runtime constants, SQLite test | Correct docs; assert stale-revision rejection and DB authority over a corrupted mirror | Fixed |
| H12 | P1 | Model failures | Unrouted planner/writer handlers converted live model failures into successful deterministic outputs | Focused live-mode test returned `ok: true` after `credential_env_not_allowed` | Propagate model errors regardless of routing; retain explicit offline fixture mode | Fixed |
| H11 | P1 | Concurrency | Lock age is treated as proof of abandonment, with no liveness, heartbeat or fencing guarantee | `acquire_run_lock` removes locks older than the threshold; focused reproduction admitted a second owner while the first worker remained active | Document operating constraint and preserve a review finding; runtime/native-lock follow-up below | Open |

## Changes implemented

### Execution and persistence boundaries

`src/core/utils.kujo` preserves only the exact `max_total_tokens` metadata key alongside existing safe token metrics; credential names such as `auth_token` remain redacted. `src/agents/agent.kujo` keeps bounded-envelope admission active at zero and rejects `/` or `\` in generated streaming step names. `src/core/state.kujo` now honors failed output-root validation before directory creation and uses atomic no-overwrite lock creation.

`tests/hardening_tests.kujo` covers the four reproduced failures plus unrouted planner/writer live-error propagation, existing malformed-step behavior, exact sink framing (missing, empty and nonempty files, including trailing newline), nested/empty/primitive redaction, original-input preservation, deep container handling, and identical embedded/standalone trace JSON. The library root test targets a repository-local absolute path so even the baseline reproduction stays within scope.

The planner and writer now propagate live model errors regardless of routing. Their former implicit deterministic fallback contradicted the documented fail-closed contract. Explicit offline fixtures still return successful deterministic model results.

Previously persisted `[REDACTED]` budgets cannot be inferred safely. Restore the numeric budget only from the original trusted workflow through a reviewed repair; do not remove a budget to force a resume. Newly persisted definitions retain the budget correctly.

### Redaction and I/O

The iterative redactor now queues only container values and resolves child containers in reverse order. It does not replace deep traversal with recursion or truncate required data. Scalar values are written directly to their parent. State persistence serializes the redacted snapshot once and uses its already-redacted trace for all trace artifacts.

`src/core/hooks.kujo` uses append I/O after checking file size, preserving existing no-trailing-newline framing. This avoids replaying the sink history for every event. Sink retention remains operator-owned; this change does not silently rotate or drop events and does not promise multi-writer framing isolation.

### Verification tooling

`tests/state_store_sqlite_tests.kujo` now submits an equal stale revision and corrupts the JSON mirror before verifying authoritative database state. `tests/run_lock_concurrency_tests.sh` launches four processes against one private directory; the winner retains the lock, preventing scheduling from admitting a later winner. It requires exactly one success and three structured timeouts without arbitrary sleeps.

`scripts/check_vm_smoke.sh` retains stdout/stderr evidence and preserves failed exit status. `tests/smoke_gate_tests.sh` verifies success, silent failure and unexpected diagnostics. CI invokes the shared script. `scripts/run_release_gate.sh` runs the added regressions and emits concise suite receipts; `DISPATCH_TEST_VERBOSE=true` exposes all passing logs. Failure output points to the full file and includes its final 80 lines. Dispatch's own CLI output is unchanged.

## Performance and efficiency

These are local single-sample observations with concurrent baseline/final verification and other machine activity. They are not isolated statistical measurements or CI latency budgets. Both throughput runs used the same 1.2.3 binary and completed all three offline research-report runs. The baseline output directory contained prior benchmark attempts; the index is small but this is another reason not to treat the ratio as a controlled speed guarantee.

| Workload | Before | After | Equivalence / limitation |
| --- | ---: | ---: | --- |
| Redact 200 nested objects | 2,590 ms | 447 ms | Both 20,781 bytes; SHA-256 `b240e3d5b1fd1cf614c023ecac632e7b12d8534b77ae394bd97cfe71b6ddf02f` |
| Append 200 events to a 1 MiB sink | 3,512 ms | 2,162 ms | Both final files 1,082,176 bytes; framing regression passes |
| Research-report, 3 offline runs | 506,033 ms | 150,160 ms | 3/3 completed on both; orchestration/persistence dominates |
| Whole-state serializations per persistence call | 2 | 1 | Same serialized value passed to DB and JSON writer |
| Redaction traversal records for the fixed workload | 2,201 | 601 | Structural count, not measured RSS |
| Existing sink bytes reread across the fixed workload | 213,058,400 | 0 | Computed exactly from the fixed input sizes and old/new I/O operations |
| Sink bytes written across the fixed workload | 213,092,000 | 33,600 | New output bytes only; no history loss |
| Runtime/package dependencies | Existing set | Same set | No additions, removals or version changes |

Model input/output token volume and schemas were deliberately preserved; no token-count reduction is claimed. There is no separate Dispatch compilation artifact or meaningful binary-size delta for these interpreted source changes. Peak RSS and build-time changes were not measured. Complete test logs remain available rather than being discarded for a smaller console receipt.

## Security and compatibility

Reviewed boundaries include CLI/config/workflow inputs; local source and output paths; signed bundle import; persisted/resumed workflow definitions; custom-provider credential selectors and endpoint allowlists; direct subprocess argv with output/time limits; declarative tool admission; key-based redaction; state files and SQLite authority; webhook signing/outbox replay; and lock/parallel scheduling behavior. Live-provider credentials and external network delivery were not exercised. Workflow/plugin code and trusted local artifact ownership remain deployment trust assumptions; key-based redaction is not a general detector for secrets embedded in arbitrary prose.

- Public function signatures, exports and normal return shapes: unchanged. Rejected library output roots now raise the existing error mechanism instead of writing despite rejection.
- CLI text, flags and normal JSON envelopes: unchanged. Unrouted planner/writer model failures now fail their step instead of silently producing success. Unsafe streaming step IDs now produce `invalid_stream_step_id`.
- Persisted formats and schema versions: unchanged; numeric token budgets survive persistence as intended.
- Config/environment: no new application configuration. The verification script adds `DISPATCH_TEST_VERBOSE` and the smoke helper accepts `DISPATCH_SMOKE_EVIDENCE_DIR` for evidence placement.
- Dependencies/action pins/release closure: unchanged.
- External consumers: safe IDs and permitted paths retain behavior; code relying on previously ignored path rejection must use the existing explicit output-root opt-in. Old corrupt token budgets require trusted repair.
- Remaining security concern: H11. Atomic creation fixes admission races but does not make age-only recovery or owner-check/delete atomic across lease expiry.

## Cross-repository follow-ups

**Kujo runtime / Dispatch locking (H11):** Dispatch needs a crash-releasing, process-owned file-lock primitive or an equivalent fenced lease with atomic compare-and-release. Current runtime `write_file_atomic(..., false)` provides exclusive creation and is used by this patch, but does not supply owner-liveness, heartbeat or conditional release semantics. Evidence is `src/core/state.kujo::acquire_run_lock` / `release_run_lock` and `tests/tmp/hardening/lock-repro.json`. The reproduction backdated a lock beyond the configured interval while retaining the first owner, then successfully acquired a second lock. Impact: long-running workers can overlap, and stale workers have no fencing barrier protecting side effects. Recommended work: add/document the runtime primitive, then migrate Dispatch with crash, expiry and release-race tests. This is required for a stronger overlapping-worker guarantee, not for the fixes in this receipt. Preserve the current lock error envelope and define how legacy lock files are handled. No sibling implementation changes were made.

## Remaining work

- **P0:** none identified in the implemented changes.
- **P1:** H11, age-based lock recovery/fencing; prevent overlapping long-running workers until resolved.
- **P2:** no additional high-confidence local implementation work admitted.
- **P3 / not worth changing:** cosmetic rewrites, removing explicit fixtures, replacing the external SDK, or collapsing public module boundaries.
- **Needs more evidence:** exact pinned CI/platform execution and live-provider/network behavior outside this local fixture environment; isolated repeated latency/RSS measurements before publishing performance guarantees.

## Verification receipt

The commands below ran from the Dispatch root unless a different working directory is stated. Full logs are ignored local evidence; deterministic workloads and regression fixtures are committed. No live-provider, deployment, or remote CI success is claimed.

| Exact command / execution | Result and evidence |
| --- | --- |
| `DISPATCH_OFFLINE_FIXTURE=true bash scripts/run_release_gate.sh` using installed `kujo` | Superseded incomplete attempt: runtime 1.0.0 is below the minimum; `baseline-release.log` |
| `git archive 83ffa0e3c1602ec1058d0455b03fba32a061f636` extracted into `tests/tmp/hardening/baseline-repo` | Frozen production source for baseline verification |
| `KUJO_BIN=/Users/robertdevore/2026/Kujolang/kujo-repos/kujo/target/release/kujo AI_SDK_PATH=/Users/robertdevore/2026/Kujolang/kujo-repos/ai-sdk DISPATCH_OFFLINE_FIXTURE=true bash scripts/run_release_gate.sh` in the baseline copy | Baseline focused suites and shards 1–9 passed before interruption; `baseline-frozen-release.log` |
| Same baseline environment with `bash ../resume-baseline-gate.sh` | Passed remaining shards 10–24, command smoke and 3/3 release workload runs (29 seconds); `resumed-baseline-release.log` |
| `KUJO_BIN="$PWD/../kujo/target/release/kujo" DISPATCH_OFFLINE_FIXTURE=true bash tests/tmp/hardening/gate-after.sh` | Final focused suites and shards 1–18 passed; `final-release.log` |
| Same final environment with `bash tests/tmp/hardening/resume-final-gate.sh` | Shards 19–24, warning-free VM/interpreter help/version, version consistency, catalog/init/explain/validate and 3/3 release workload runs passed; `resumed-final-release.log` |
| `cmp scripts/run_release_gate.sh tests/tmp/hardening/gate-after.sh` | Passed: frozen final harness matches the committed gate source |
| `DISPATCH_OFFLINE_FIXTURE=true ../kujo/target/release/kujo test-run tests/hardening_tests.kujo -v` | Latest 8/8 passed after the final live-error fix; `final-regressions.log` |
| `KUJO_BIN="$PWD/../kujo/target/release/kujo" bash tests/run_lock_concurrency_tests.sh` | Passed: one winner, three timeouts; also executed by final gate |
| `bash tests/smoke_gate_tests.sh` | Passed: success, exit-23 silent failure, stderr diagnostics; also executed by final gate |
| `KUJO_BIN="$PWD/../kujo/target/release/kujo" DISPATCH_OFFLINE_FIXTURE=true bash scripts/check_vm_smoke.sh` | Passed; `vm-smoke-receipt.log` and `tests/tmp/vm-smoke/` |
| `../kujo/target/release/kujo check src/core/utils.kujo`, `check dispatch.kujo`, `check tests/hardening_tests.kujo` | All passed; `check-utils.log`, `check-dispatch.log`, `check-hardening.log` |
| `bash -n scripts/*.sh tests/*.sh` and `git diff --check` | Passed |
| `bash .github/scripts/check-kujo-tool-artifacts.sh` | Passed for the pre-commit state; also passed for explicit range `83ffa0e3c1602ec1058d0455b03fba32a061f636..1caefcc696e10bd1d7d287c307a3fb55c6eae2e8` |
| `DISPATCH_OFFLINE_FIXTURE=true ../kujo/target/release/kujo run tests/benchmarks/run_throughput.kujo 3` | Baseline 3/3 and final 3/3 passed; `baseline-supported-throughput.log`, `after-throughput.log` |
| `../kujo/target/release/kujo run tests/benchmarks/redaction.kujo` and `run tests/benchmarks/webhook_sink.kujo` (absolute runtime path in baseline snapshot) | Passed before/after, matching output evidence; `baseline-redaction.log`, `after-redaction.log`, `baseline-frozen-sink.log`, `after-sink.log` |
| `DISPATCH_OFFLINE_FIXTURE=false KUJO_BIN=/nonexistent/dispatch-audit-runtime ../kujo/target/release/kujo run tests/benchmarks/run_throughput.kujo 1` | Expected failure verified: 0/1 completed and process exit 1; `throughput-failure.log`; no provider network call |

The release-evidence JSON records the pre-commit `HEAD` (`83ffa0e3...`); the final run exercised the working-tree changes described here. The ending implementation commit above anchors that verified source rather than treating the pre-commit evidence field as a clean-tree build identity.

The frozen baseline recorded **155/155** passing tests across 29 suites and completed its 3/3 release workload. The final gate recorded **162/162** tests across 30 suites. The later eight-test hardening run adds the previously absent unrouted-live-error test: **163 distinct passing test cases** across the combined final evidence, plus the shell smoke/lock checks. Gate counts are not inflated by counting reruns twice.


## Durable finding record

SignalBox admitted only H11: Capture `cap_bb175c93-71f9-436e-9339-d1c7715cae4c`, Signal `sig_bccf9bfe-ea8c-424e-b1b5-4b71924613b3`, project `dispatch`. Exact-ID retrieval and the `Dispatch lock` concept search verified both. No duplicates were found for `Dispatch lock` or `acquire_run_lock` before writing. Completed fixes, routine verification and speculative findings were rejected as capture candidates. The detailed completed-session record belongs in Strata, not SignalBox.
