# Durable review checkpoint evidence

Source audit and implementation on 2026-09-26 America/Detroit (2026-09-27 UTC).
Plan: [durable-review-checkpoint-plan.md](durable-review-checkpoint-plan.md).
Contract and crash table: [review-checkpoints.md](../review-checkpoints.md).

## Before / after

Baseline Dispatch 61a367e already persisted workflows, action/evaluator attempts,
results, effects, control barriers and revision-bound intervention decisions. Its
locked CLI reloaded authoritative state and reconciled the journal. Workcell
already preserved evidence before late evaluation. There was no generic immutable
review manifest binding state bytes and journal, and the existing example retried
evaluation inside one process. We reused those implementations.

The audit reproduced a rejected run completing pending descendants through the
direct runner. Fix 86a5f2c shares terminal classification; all five previously
used terminal spellings now reject without writing authority or executing steps.

Added `checkpoint` publication and optional `resume-decision --checkpoint` admission,
bounded immutable state/manifest files, versioned JSON schema and process-restart
proof. Source runtime remains pinned through the existing release refs; no new
runtime primitive is needed. Shared real Workcell/Eval fixture producers were
extracted from the existing example without changing their execution.

## Actual restart evidence

Final fixture root: `tests/tmp/durable-review-63009` (ignored generated evidence).
Run: `run-1790470206138-3990`.
Checkpoint: `cp_a8a2c24953dd950aee0b8dc1c9b7fcca9a3320bda498c8ecbc10b0ce30554c5d`.
Published manifest 932 bytes; canonical state snapshot 51,892 bytes.
Final state SHA-256:
`d78b9b7659098b7b786b49ce2937f44c81861eb71a5d30123a42d3f888a5d9a2`.
Final journal SHA-256:
`569f473fb99efa433484b3942599d27e1ad17a0ab53a1fb146a59e49fa515360`.

`KUJO_BIN=/tmp/kujo-next-candidate-bin bash tests/durable_review_contract.sh` passed
using Dispatch 562f56d, Kujo bdf634f runtime, Workcell dc2afd1, Eval 6a5ab09 and RunLedger e0187ea.
No live provider or model was used. Workcell's backend was explicitly `fixture`.
First controller invoked real Workcell preservation and manifest verification,
then real Eval plus checksum verification; its quality judgment failed. Dispatch
retained evidence, stopped descendants, published the checkpoint and exited.

Fresh CLI processes rejected a missing manifest and stale decision revision;
byte comparison proved authority unchanged. Another ordinary CLI process loaded
and locked the store, validated the checkpoint, accepted an explicit local review
override and completed the descendant. Action/evaluation/downstream attempt counts
were exactly [1,1,1]. The failed evaluation remains a failed evaluation; the reviewer
accepted its outcome rather than rerunning or replacing it. Duplicate decision
delivery returned already_applied, left state bytes unchanged and produced only
one intervention-decision journal record.

A final process reconciled the journal and rehashed unchanged Workcell/Eval
artifacts. Real RunLedger start/correlate/finish/list commands produced a pass
receipt referencing the Dispatch run and proof digest. Missing cost remains null.
The fixture asserts correlation and cost provenance, not just CLI exit success.
Identifiers/times vary on new runs; retained bytes and references are verifiable.

## Focused tests and review

Four checkpoint tests pass in both filesystem and SQLite modes. SQLite additionally
passes with a deliberately stale `state.json` secondary export, demonstrating that
publication reads database authority. Coverage includes repeat publication, no
authority mutation, schema validation, altered manifest/snapshot, invalid IDs,
changed inputs, in-flight work and torn/orphan journal records. Six execution
tests include the terminal-admission regression across five terminal statuses.

Fresh review found and corrected UTF-8 character-count versus byte-count limits.
It also rejected unknown boundary schemas/empty identities and missing boundary
journal history before publication, keeping emitted manifests within v1's contract.
The initial tamper test omitted write_file's explicit overwrite flag and failed;
the test was repaired without changing production behavior. Early fixture runs
also correctly rejected absolute Dispatch output roots and Workcell output outside
its allowed temporary root. The final fixture uses a relative Dispatch output
root and private test TMPDIR, without relaxing production checks.

Review checked manifest-last publication and directory-sync ordering, no snapshot-selected
paths, bounded confined reads, exact live-state matching, SQLite authority, shared
terminal classification, retained claim/idempotency semantics and content privacy.
No new external messaging, replay mechanism or provider policy was introduced.
The checkpoint path runs only when requested, outside the scheduler hot path.
No production checkpoint-latency or cross-machine recovery claim is made.

An additional final CLI publication run under `tests/tmp/durable-review-55111`
also passed: repeated `dispatch.kujo checkpoint` returned exactly the same manifest
as the publishing API before the full stop/restart proof. The unchanged older
failure/evaluator-retry example returned ok for `run-1790468449525-2064`.

The first full release-gate invocation passed all focused suites and 23/24 core
shards, then found the old help snapshot (18 expected commands versus 19 actual).
Actual help was inspected: the only intended changes are the checkpoint command
and optional resume-decision flag. The expected lines were updated, and the
four-test affected shard passed. The full gate was rerun, not bypassed.

Final `KUJO_BIN=/tmp/kujo-next-candidate-bin DISPATCH_OFFLINE_FIXTURE=true bash
scripts/run_release_gate.sh` passed with exit 0: every smoke/concurrency/bridge
check, all focused suites, all 101 core tests across 24 shards, quiet VM/interpreter
command surfaces, version consistency, and 3/3 bounded release workloads in 24s.
The full log is `/tmp/dispatch-next-release-gate-final.log`; suite logs and workload
JSON are under ignored `tests/tmp`. Separate filesystem and SQLite checkpoint
tests, the final-head real cross-repository restart proof, shell syntax and diff
whitespace checks passed. No check was suppressed to obtain the pass.

Final commit references are indexed in Kujo's parent audit. Open design boundaries
are documented, not hidden behind
a claim that all durable execution is complete: lost authority restoration,
cross-machine migration, authenticated remote intervention, journal archival and
independently verified external effect attestations remain ecosystem work.
