# Persisted effect-assurance negotiation

Experimental, opt-in, unreleased. The canonical policy semantics remain in
[effect-assurance-compatibility.md](effect-assurance-compatibility.md). This document
specifies the local persistence/admission implementation, not a new effect envelope.
Execution-result/v1 and effect-assurance/v1alpha1 remain unchanged.

## Authority and representation

`state.kujo::create_run_state` records `assurance_negotiation`. Historical runs
without it remain historical legacy; new ordinary runs record explicit legacy.
Protected runs contain a closed seven-field object:

- schema: `dispatch.assurance-negotiation/v1alpha1`;
- mode: optional or required;
- fallback: deny or explicitly optional legacy_unavailable;
- profile and profile_version: exact operator selection;
- config_revision: lowercase SHA-256 of normalized public configuration metadata;
- policy_sha256: SHA-256 of the other six fields serialized by Kujo `to_json`.

The initial `assurance_policy_selected` control record binds this object, storage
backend, persisted/redacted workflow and initial input digests. It is immutable:
no policy upgrade/downgrade or input/workflow migration operation is introduced.
Existing journal hash-chain, durable record and cursor checks remain authoritative.
Later sidecar selections and replay bindings must match their journal records.
A missing field cannot turn a protected run into historical legacy.

## Installed configuration

`assurance_configuration.kujo` commits eleven public descriptor fields: schema,
mode, fallback, profile, profile_version, issuer, mechanism, verifier_id,
verifier_version, verifier_sha256 and authority_sha256. Identifiers are bounded
ASCII, digests are fixed SHA-256. Configuration identity uses normalized metadata;
execution-result identity still hashes exact original bytes, without canonicalization.

An operator-installed `assurance_host(revision, current_state)` callback resolves
only that exact revision and returns its current status, descriptor, authenticated
local authority commitment, installed verifier function, bounded implementation
manifest and the independently owned expected effect/result context. No code is
loaded from producer JSON. The callback's process default is irrelevant to old runs.
Missing/disabled/revoked revisions cannot be replaced by an equivalent-looking R2.
The installed host MUST supply current authoritative revocation state. The run
digest cannot detect rollback of an external operator registry that falsely reports
revoked authority as active; such a host violates the trust contract. No external
monotonic registry service is implemented.

The implementation manifest contains 1–16 operator-owned confined source references,
at most 1 MiB each; its ordered content hashes must match verifier_sha256. Operators
MUST cover the verifier and its relevant dependencies, pin the runtime/controller,
and use immutable trusted installations. The host MUST establish that its function
is the reviewed implementation described by that manifest. A hash is not authentication
or proof that arbitrary host code is honest. Credentials and raw configuration stay
in installed host code/private stores, outside persisted run authority and journal.

## New-run surface

This is an explicit operator API, not a globally enabled CLI mode or tool-policy
profile. Workflow files cannot install verifiers. Construct an operator descriptor
and installed host, then use:

```kujo
created := create_negotiated_run(workflow, input, output_root, options, descriptor, host)
options["assurance_host"] := host
result := run_workflow(workflow, created["run_state"], tools, options)
```

Imports are `src.core.assurance_admission` and `src.core.runner`. Check `created.ok`
before execution. The copyable complete offline controller is
`tests/persisted_negotiation_fixture.kujo`; its operator-store.json contains public
revision metadata, while installed functions and Ability session authentication
remain outside that document. Its test installation commands are not a public registry.

The bounded protected path currently requires serialized execution and existing
failure control (which limits automatic tool retries to one action attempt).
It supports reviewed retry_step/retry_clean, not a new general workflow policy engine.
Generic CLI/controller paths without the installed host refuse protected continuation.
Tool allow/deny profiles keep their existing independent ownership and semantics.

## Storage compatibility and old controllers

A feature field alone is insufficient: the audited previous controller ignores
unknown state schema versions/fields. Protected state therefore uses the existing
state slot with this exact non-JSON discriminator:

`DISPATCH_ASSURANCE_STATE_V1ALPHA1` followed by newline and the JSON state.

The state includes `required_features = ["effect-assurance-negotiation/v1alpha1"]`.
Unmodified JSON readers refuse it instead of silently ignoring the policy. Both
SQLite state_json and secondary state.json use this guarded codec. Legacy state
remains ordinary JSON. This is an intentional opt-in storage compatibility boundary;
use Dispatch's state loader/inspection APIs, not raw JSON parsing of protected files.
Unknown codec/features fail closed. No general run-state schema bump is required.

`assurance_store` is pinned in the initial control record. An existing SQLite row
wins over process filesystem defaults and stale JSON. A protected SQLite run cannot
fall back when its database/row disappears. A filesystem run retains its pinned
backend. Persistence rejects policy changes; loading/admission verifies the retained
anchor and journal. The actual 63d8097 controller is exercised against protected
filesystem, SQLite and imported artifacts and cannot load them.

## Locked admission and audit

`resume_negotiated_review` acquires the existing run lock through the runner,
reloads authoritative state, reconciles history, checks an optional checkpoint,
resolves the exact current installed revision and evaluates current assurance.
It verifies the current boundary, action attempt and authoritative result facts,
then invokes existing intervention validation and v1 replay safety. It records the
policy/configuration identity, resolution and source/next attempt before continuing.

Configuration, installed bytes and assurance are rechecked at execution entry and
before pending/running replay, including immediately after lifecycle hooks and state persistence, before step execution. The adapter still owns its final sink/application admission
checks. A persisted resolution is not cached permission. External revocation and
Dispatch/application locks are not one distributed transaction: a revocation after
admission may cause a later controlled failure; it cannot undo admitted work.

`select_run_assurance` copies a bounded (8 KiB) sidecar into a content-addressed,
confined run artifact and journals the selection. A selected read failure, altered
bytes or symlink is a denial, never null. Conflicting documents for the same source
attempt are rejected. Current optional/required fallback rules are unchanged.

Resolution denials are bounded control-journal audit records, not permission.
Audit-only persistence advances the state/request revision; old decisions/checkpoints
must be refreshed. Corrupt/divergent state is not repaired during denial logging.
If denial audit cannot be recorded, the response remains denied and includes
assurance_denial_audit_unavailable. No credentials or configuration payloads are logged.

## Checkpoints, bundles and threat boundary

Review checkpoints already hash the whole state snapshot, covering policy, selected
sidecar and configuration revision. No parallel checkpoint authority is added.
Exports use authoritative state, not stale secondary JSON. Existing signed bundles
preserve guarded bytes and policy. Protected imports cannot rename/overwrite an
existing identity. Bundles do not contain all journal/application evidence, so an
import lacking that surviving authority cannot resume. No portable recovery claim.

Rollback protection depends on surviving trusted authority. Restoring/replacing the
entire database, all state, journal and records together is not detectable without
an external monotonic anchor. Arbitrary host administration can replace code and
trusted files or invoke effects directly: Kujo is not a sandbox. This implementation
does not claim protection against that authority or exactly-once external effects.

## Validation and maturity

The release gate runs contract/schema/historical-legacy tests, restart/configuration/rollback/import tests,
and required-mode SQLite/Git/Ability fixtures, in addition to all existing legacy,
failure-gate, durable-review and assurance tests. Exact evidence and review findings
are retained in the audit report. A fresh review found and closed the running-attempt restart gap: pending-only checks would miss a replay whose started state survived a crash. Hook-driven expiry/revocation and another controller loading that running state now deny without invoking the action. Alpha is not automatically promoted. Beta review
must evaluate this deliberate storage boundary, installation/manifest trust and the
bounded retry API; remote trust and multi-effect execution remain separate work.
