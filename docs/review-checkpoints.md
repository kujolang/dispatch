# Durable review checkpoints

Implemented on source main; not a published release. Requires Dispatch's existing
source runtime pin with `sync_directory_beneath`. Published Kujo 1.5.0 lacks that
primitive despite sharing the same reported version number.

```sh
kujo run dispatch.kujo checkpoint RUN_ID --output-root outputs
kujo run dispatch.kujo resume-decision decision.json --output-root outputs --checkpoint cp_SHA256
```

The first command emits JSON `{ok, checkpoint, checkpoint_ref}`. Publication
requires an existing paused run, open boundary, matching v2 request/revision,
no running steps, and a reconciled journal. It loads the authoritative filesystem
or SQLite state again after taking the process-owned run lock. Publication does
not increment the revision, mutate authority, close the barrier or send messages.
Repeated publication of identical bytes returns the same content-derived ID.

`dispatch.review-checkpoint/v1` binds run/revision/boundary, canonical state SHA
and confined relative reference, input/workflow/control-policy SHA, and existing
control-journal cursor. Snapshot content includes existing run/step/attempt IDs,
capability declarations, result/effect/evidence references, preservation,
evaluation and intervention. Only read-time `health` diagnostics are excluded.
There is no new lifecycle or claim that declarations prove enforcement. Runtime
environment and materialization identities remain the existing producer-owned
descriptor contract, not independently attested by this manifest.

State is at most 8 MiB and manifest at most 64 KiB. An immutable state file is
written and directory-synced before the manifest is written and directory-synced.
The manifest is the publication marker. Existing state loading is reused; these
limits bound checkpoint artifacts, not the pre-existing store loader's memory.
Readers derive paths from a 64-digit SHA-256 ID and use confined bounded reads.
Exact expected manifest and snapshot bytes must agree with live authority.
Unknown manifest fields are rejected in v1; extensions require a new version.

Use a private output directory and restrictive process umask (for example 077).
Snapshots inherit persisted-state redaction and filesystem access policy; they
can still contain private application data and are **not telemetry**. No snapshot
is uploaded. Hashes are integrity checks, not authentication against someone
able to rewrite both authority and evidence. Retention is run-owner policy;
publication is explicit and each unchanged boundary creates only one checkpoint.

## Continuation and crash semantics

The optional `--checkpoint` flag adds validation inside the existing locked v2
decision transaction. Existing revision, allowed-action, effect uncertainty,
preservation deadline and materialization checks still control admission. Local
actor fields do not authenticate a remote human: transport adapters must establish
identity and authorization. The trusted local CLI retains its existing authority.

An identical already-applied decision returns `already_applied` without executing
anything, even though its old checkpoint is now historical. A claimed unfinished
decision blocks recovery; a conflicting payload rejects. New decisions must
validate the checkpoint before claiming or closing the boundary. `approve_override`
accepts the existing outcome and admits descendants; it does not replay the action
or change its original evaluation verdict. A v1 decision cannot use this flag.

| Interruption | Behavior / required recovery |
| --- | --- |
| Before execution | Existing pending state; no safe-boundary checkpoint until review |
| During execution, after local mutation or external effect | Running/unknown effects do not become safe; no automatic checkpoint/replay |
| After result/event record but before journal indexing | Existing orphan-record or cursor reconciliation blocks continuation |
| Before checkpoint manifest publication | Orphan snapshot conveys no permission; repeat publication can finish identical bytes |
| After manifest publication | Fresh process requires surviving authority, matching journal, snapshot and new valid decision |
| After decision claim, before completion receipt | Claimed receipt or journal mismatch blocks duplicate execution; explicit recovery required |
| Evaluator crash | Existing error/indeterminate evaluation and policy-controlled review, not a quality pass |
| Intervention transport failure | Boundary remains stopped; local checkpoint requires no connected model/transport |
| Expired Workcell preservation / missing materializer | Existing retry admission rejects; manifest does not extend lifetime or invent an adapter |
| Lost run store or moved environment | This v1 scope is `existing_run_store`; no restore/import or cross-machine migration promise |

No exactly-once external effects or universal rollback is provided. The direct
runner also now rejects rejected runs, closing the reproduced terminal-admission
gap. Callers must still pass current state; the ordinary CLI reloads under lock.

## Reproduce and inspect

```sh
KUJO_BIN=/absolute/path/to/source-kujo bash tests/durable_review_contract.sh
DISPATCH_OFFLINE_FIXTURE=true KUJO_BIN=/absolute/path/to/source-kujo bash scripts/run_release_gate.sh
```

The separate-process fixture needs sibling Workcell, Eval and RunLedger checkouts
(override `FAILURE_GATE_WORKCELL`, `FAILURE_GATE_EVAL`, `FAILURE_GATE_RUNLEDGER`),
Git and jq. It uses Workcell's named fixture backend, not a live provider.
It starts a real preserved workspace, verifies its manifest, executes real Eval
with a failing file check, pauses, publishes a checkpoint, and exits. Separate CLI
processes reject missing/stale inputs, then accept the explicit fixture review.
A descendant executes once; action and evaluator remain at one attempt each.
Duplicate delivery leaves final state unchanged. Another process reconciles the
journal, rechecks evidence digests and writes a correlated real RunLedger receipt.
Generated proof, logs and ledger records stay under the printed `tests/tmp` root.
Reproducibility means re-verifiable retained bytes and decisions, not identical
UUIDs or wall-clock times across separate runs. The full Dispatch gate contains
local checkpoint tests; the cross-repository fixture is an explicit separate gate.

Next: design restoration from a backed-up authoritative store and independently
verified effect attestations before supporting arbitrary interrupted execution.
Do not infer either feature from this bounded review-boundary slice.
