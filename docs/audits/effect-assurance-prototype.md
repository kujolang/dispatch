# Wave C effect assurance audit and prototype plan

Status: design validated with two adapters; opt-in assurance prototype implemented.
Canonical validation and evidence are recorded below. Experimental, unreleased;
broad migration unscheduled.
No execution-result/v2 or production admission migration is proposed here.

## Baseline (fetched main, 2026-09-26 local)

| Repository | Commit | State |
| --- | --- | --- |
| Kujo | 39d5a0a381c374a6f9bd6ec75bb820a5b68aeb68 | clean |
| Dispatch | 73e7a87fa7fc453085fdf1b7dd88e6ed88bf31a3 | clean |
| Workcell | dc2afd18c0638a9502e9aa1c9db8570657c55f51 | clean |
| Agents SDK | bb2202d8b54f44717b1b1f0157a6774f2027cea1 | unrelated untracked maintenance agent work; untouched |
| Ability | 63d4367d677ce350bb2756dab02603170ca44cee | clean, read-only |
| MCP | 07845898ee9f2662d0e0e364973d77cdaac04762 | clean |
| RunLedger | 97cb607a062efeecc7fcdc4e4a4e4a4e0308f90d45fe | clean |
| Watchdog | 5adcc2623b6a5655ab86c4c7411f05a407673e88 | clean |

## Source and trust map

| Fields / decision | Source | Current authority |
| --- | --- | --- |
| result_id, subject run/step/attempt, attempt, producer | Kujo schemas/workflow-control/execution-result-v1.schema.json; Dispatch src/core/control.kujo::validate_execution_result | Producer assertion; shape validation is not authentication or linkage to current run |
| status, classification, started_at, finished_at | Same schema; control.kujo::execution_failure_result | Producer assertion, except runner-created failures are observed execution metadata; timeout does not prove no effect |
| effect_id, class, state | Same schema; intervention.kujo::retry_is_effect_safe | Producer assertion supplied through trusted integration; class and completion remain separate |
| idempotency_key, enforced_by, enforcement_evidence_ref | intervention.kujo; tests/failure_gate_safety_tests.kujo | Unverified nonempty references. Existing trusted adapter/operator boundary, no automatic reference fetch |
| compensation object / compensated state | v1 schema and retry_is_effect_safe | Producer assertion; compensation existence is not execution or verified reversal; external non-idempotent still blocked |
| none; local_reversible except started/unknown | retry_is_effect_safe | Existing class/state rule; empty observed effects reject, absent result falls back to configured none/local_reversible |
| external_idempotent including unknown state | retry_is_effect_safe; tests/reexecution_lifecycle_fixture.kujo | Allowed with three enforcement strings; actual local sink fixture demonstrates dedup, not authenticated assurance |
| external_non_idempotent/destructive | retry_is_effect_safe | Rejected even for not_started; this prototype must not weaken the policy |
| actor id/type/authenticated_by/authorization | validate_intervention_decision; docs/control-boundaries.md | Operator transport must authenticate; JSON actor metadata is attribution |
| boundary, revision, allowed_actions, preservation | intervention.kujo; review_checkpoint.kujo; control_journal.kujo | Surviving authoritative state, compare/reconcile checks; not universal recovery |
| effect_idempotency_key run:step | src/core/runner.kujo; README | Derived stable retry key, not sink enforcement |
| source commit, workflow hash, image digest, input refs, secret refs, dependency mode, automatic_retry_allowed | Workcell src/evidence/execution_result.kujo::build_reexecution_descriptor | Observed receipt metadata plus derived eligibility from configured network mode; not a transaction proof |
| local_reversible/committed vs external_non_idempotent/unknown | Workcell write_execution_evidence | Conservative derived classification from execution confinement/network, no knowledge of arbitrary external state |
| retention deadline/provider/cleanup/workspace refs | Workcell src/evidence/preservation.kujo | Operator deadline, observed existence, provider assertions; filesystem retained is not rollback |
| enforcement authority, observation, limitations | Workcell src/evidence/controls.kujo | Explicit provider/operator/workcell distinctions; not an effect assurance contract |
| Ability kind/resource, intrinsic/keyed/none | ability/src/contract.kujo; Agents SDK src/agents/abilities/contract.kujo | Declarations; SDK derives risk hints, gateway wrapper validates receipt identity, not sink history |
| invocation/principal/tenant/request digest/idempotency state/receipt | ability/src/runtime.kujo and contracts.kujo | Application service callbacks own begin/complete enforcement; commit_failed and in_progress stay distinct; receipt metadata shape alone not proof |
| MCP annotations, _kujo controls, gateway correlation | mcp/src/abilities/projection.kujo, gateway.kujo; docs/adr/0001-universal-ability-platform.md | Projection/forwarded claims; application owns authenticated principal, scopes, approvals, durable sink |

No universal operation or transaction ID is authenticated by v1. Git commit IDs
in Workcell are source identity, not evidence of external deployment. Message IDs
in SDK session storage identify stored messages, not verified delivery.

## Adapter choice and ownership

1. Dispatch experimental SQLite sink: use existing Kujo database primitives and
   Dispatch's SQLite FULL durability convention. A single transaction inserts a
   unique scoped key plus a logical effect row. Changed intent conflicts. It is a
   real local database producer, not a replacement for Dispatch state storage.
2. Workcell experimental Git ref producer: use existing structured Git argv and
   source/workspace ownership conventions. An atomic ref transaction binds an
   immutable operation marker and compare-and-swap target ref. This has different
   semantics from SQL, including ref movement and conflicting preconditions.

Adapters stay explicitly experimental; Workcell execution/preservation paths are
unchanged. No provider credentials, remote network, runtime edits, SDK/MCP edits.

## Plan before implementation

- Dispatch src/core/effect_assurance.kujo: closed bounded single-effect additive
  document; configured resolver callbacks, exact result bytes/digest and current
  state binding, scope/input/precondition/transaction binding, external issuer
  mapping, integer UTC freshness, fixed reason codes, existing replay policy.
- Dispatch src/adapters/sqlite_effect.kujo: real transactional sink and readback;
  trusted path/config; unique scope/key; bounded digest-only intent; no raw payload.
- Workcell src/evidence/git_effect.kujo: dedicated operator-owned bare repository,
  fixed ref namespace, CAS plus immutable transaction marker, bounded subprocesses.
- Dispatch schemas/effect-assurance-v1alpha1.schema.json: local prototype name
  after this cross-repository audit, not a new Kujo-wide stable contract.
- Separate-process fixtures exercise precommit loss, commit-before-reply SIGKILL,
  verified idempotent replay, ref conflict, mismatches, expiry, forged claims,
  missing adapters, malicious refs, bounds and privacy. No helper-only proof.
- Add focused fixtures to each canonical gate. Re-run Dispatch failure-control,
  reexecution and review checkpoint paths; Kujo docs/full gate; unchanged Wave A
  integration. Record exact commands, raw fixture evidence and limitations.
- Fresh review includes TOCTOU: live verification alone cannot authorize delayed
  replay. The sink must enforce scope/input/precondition/expiry again at mutation.
  No portable safe=true token, exactly-once guarantee, arbitrary URL resolution,
  automatic compensation, or broad migration.

## Fresh review and fixes

Reviewed separately from fixture success: issuer is selected from host context,
not JSON; mappings are executable trusted code; exact result bytes and numeric
attempt bind to current state; continuation target and boundary must be the same
step. Review found and fixed a prototype gap where a valid proof for one step
could otherwise precede preparation of a different boundary step. A regression
now rejects that before any mutation. Duplicate current step IDs reject.

Git readback now distinguishes a successful empty ref query from command errors;
an error cannot establish absence. Changed input and target movement reject at
the sink, not only in JSON validation. Expiry checks remain in both resolver and
mutation path. Stale exact documents are re-resolved against live records, never
accepted solely because their digest and issuer label match.

No arbitrary field, target path, URL or raw business payload is projected. SHA-256
digests still have dictionary-disclosure risk for low-entropy identifiers; real
profiles should select opaque IDs/keyed commitments as appropriate. Trusted local
paths and registries require host isolation from untrusted workloads. This is
not a filesystem sandbox or signed portable attestation.

Known narrow boundary: the retained v1 effect must already identify the exact
enforcement observation reference. The prototype does not manufacture enforcement
fields for a result that lacks them, reclassify non-idempotent uncertainty, or
rewrite result bytes. Discovering a later state that conflicts with the original
reference blocks; future adapters need explicit reference/observation semantics.

Clock rollback, mid-Git-process kill, machine power loss, hostile store mutation,
remote authentication, retention/GC and multi-effect atomic admission remain
outside this prototype. Validity is checked at mutation admission, not a promise
that a slow operation finishes before the deadline. SQLite's unique key and Git's
CAS/immutable marker continue enforcing identity after that check.

## Recorded proof and validation

The final pre-gate proof is committed under
`docs/evidence/effect-assurance-2026-09-26/`: eight real scenarios, 45 semantic/input
cases for each of four successful crash/replay paths (180 cases total), original
result/assurance bytes, artifact hashes, machine-readable decisions and fixed
privacy diagnostics. The four additional golden paths are actual expiry and
non-idempotent uncertainty for each adapter. Rejected continuation leaves retained
state unchanged. Successful continuation reconciles the journal and releases the
descendant only after the adapter's idempotent replay succeeds.

Runtime: immutable optimized Kujo binary built from source 5d72aab (unchanged
runtime source at 39d5a0a), SHA-256
`4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93`.
No runtime source or stable execution-result schema was changed.

Initial validation invocation corrections are retained honestly: Workcell's
version guard defaults to 1.2.1 and rejected the 1.5.0 source runtime until the
existing WORKCELL_TEST_KUJO_VERSION=1.5.0 setting was supplied; no guard was removed.
An initial Dispatch full gate was invalidated by editing its shell script while
Bash was reading it (all 24 shards had passed before the offset error). The final
script passed bash -n and is rerun in full without concurrent source edits.
These are invocation mistakes, not suppressed product failures.

Docker engine validation is unavailable because the selected local Unix socket
does not exist. The isolated docker info command failed before any workload. See
the committed availability receipt for the safe resume command; offline Docker
endpoint fixtures are not live Docker evidence. No live provider credentials used.

Final gates (all exit 0):

- Kujo: cargo fmt --check, cargo check, full release gate including cargo test,
  strict Clippy, security/package/parity, 149 dual and 149 interpreter fixtures
  (11 documented skips each), plus affected docs contracts. Existing build-only
  audit exception RUSTSEC-2025-0141 unchanged; optional cargo-deny unavailable;
  opt-in socket/benchmark gates not enabled. Runtime/schema diff is empty.
- Dispatch: complete frozen release gate, 24 shards/101 main tests, 14 control,
  20 failure safety (including compensation non-authority), 6 execution failure,
  4 review checkpoint, real reexecution/decision claims, SDK/routing/SQLite,
  command surface and 3/3 bounded release workload runs. New schema and eight
  real effect scenarios/180 assurance cases are part of the gate.
- Workcell: full tests/run.sh with existing source-runtime version declaration,
  quality, release report (249 passes), version consistency, Markdown links,
  experimental Git gate, 23 official-adapter tests, integrity and clean install.
- Unchanged Wave A: real Watchdog HTTP/restart/RunLedger integration plus 76 input
  cases passed; RunLedger full suite passed. No correlation or usage policy edits.
- Additional interpreter schema and historical live-readback/binding/issuer/expiry
  checks passed. The real golden paths use the default VM. An initial optional
  invocation incorrectly reused a completed fixture's absent review request;
  rerunning against a paused fixture proved the intended checks without replay.

See committed validation.json, verified-logs.json, state-summaries.json and proof
artifacts for machine-readable evidence. Full local logs are referenced by digest.
Hosted CI success is not claimed by these local results.
