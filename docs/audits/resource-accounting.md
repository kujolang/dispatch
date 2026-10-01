# Sourced resource accounting and bounded Eval budgets

This is an experimental trusted retained-host extension of Dispatch's existing graph
journal, run lock, source-bound host configuration, DAG and recovery path. The
[decision](../contracts/resources/decision.md) records the pre-implementation source
ownership audit; the [protocol](../contracts/resources/protocol.md) and
[crash matrix](../contracts/resources/crash-matrix.md) define the bounded contract.
Validation status and exact source/toolchain pins belong in the accompanying evidence.

## Verified source

The [validation record](../evidence/resource-accounting/validation.json) covers
Dispatch `2577c60ff7ef79992f34b4627799f488cf5edcd6`: all 87 focused canonical suites,
24 shards (101 tests), command-surface checks and 3/3 release workloads passed.
New coverage includes 20 native assertions and 19 process integration proof groups.
The first canonical run failed because isolated recovery copies omitted the new
source-bound evaluator worker; that failure, its correction and the full successful
rerun are retained. No failing run is presented as passing.

Kujo documentation source `51369e42b38efb4479af440c8370ac8a4fea3a7a` passed formatting,
the locked release build and 13 contract tests; two existing artifact-dependent
tests remained explicitly ignored. Concurrent primary Kujo runtime edits were not
incorporated. The evidence includes commands, warnings, source pins and verified
SHA-256 inventories. Hosted canonical success is not claimed by these local results.
Post-push artifact CI exposed the generic log-ignore rule rejecting intentionally
retained evidence. A narrow policy exception and three guard tests now preserve
reviewed logs while rejecting ordinary output. Kujo's separate release-state check
fails because the existing `v1.7.0` tag conflicts with unchanged `v1.6.0` stable
installation defaults; that release-owned mismatch is recorded, not hidden or
folded into this resource tranche. See `hosted_followup` in the validation record.

## Implementation and authority

Program attempts retain their existing unit and identities. First-class Eval nodes
now have separate reservations, permanently consumed dispatches and exact result
resolution. The evaluator runs in a separate process using actual Eval result
semantics. An exclusive retained claim precedes evaluation. Only a conclusive local
infrastructure failure permits an explicitly selected second Eval attempt over the
same bound subject. It never reruns the subject program or reuses an effect admission.

The planner accepts explicit ready nodes and checks program/Eval capacity together.
Applying its exact candidate under existing graph/child locks commits one immutable
reservation event. It does not select a branch, schedule nodes or invoke work. Human
decisions, branch activations and subgraph receipts are separate facts, not extra
program dispatches. Inactive paths receive no reservation.

Runtime reports and SDK context ledgers remain source artifacts. Dispatch binds them
to exact consumed attempts and retains their raw bytes/digests. Reported, estimated,
observed and unknown quantities remain separate; incomplete totals are null with
explicit known subtotals and missing coverage. No provider adapter, telemetry collector
or monetary calculator is duplicated. Numeric token/time enforcement is deferred;
post-hoc measurements cannot promise safe worst-case future reservations. A closed
source-availability prerequisite can block new work when prior provider usage is
missing or incomplete. This is not a token ceiling.

## Boundary review

| Gap | Change possible | Guard |
| --- | --- | --- |
| Assessment → reservation | Revision, journal, graph definition, inputs, operator, capacity | Locked exact candidate recomputation and current host authorization |
| Reservation → Eval dispatch | Producer identity, evaluator config, source availability, authority | Exact binding and live evaluator identity; current host validation; source guard |
| Dispatch → evaluator work | Controller death, duplicate worker delivery, evaluator config | Permanently consumed dispatch; exclusive retained claim; worker config recheck |
| Work → result recording | Reply loss, wrong result, missing claim | Exact attempt/binding/subject/evidence/evaluator validation; no implicit retry |
| Measurement assessment → publication | Source replacement, operator revocation | Digest-bound candidate and final locked source/authority revalidation |
| Journal → accounting projection | Lost append/state publication, corrupt bytes | Existing immutable lineage repair, digest checks and replayed accounting projection |
| Resource exhaustion → completion | No capacity for new work | Resolution and terminal publication do not require a new reservation |

The installed adapter owns truthful attribution and conclusive process termination.
A hash alone cannot certify provider truth, disjoint observations or malicious
participants. Imported historical Eval evidence is not retroactively counted as an
invocation. New source/control records stay host-local; historical participant wire,
alpha/beta and portable commitment bytes are unchanged.

## Next major phase

Recommend bounded human adoption and operator usability: exercise one installed
end-to-end workflow with an inspect/plan/apply interface and sourced adapter evidence.
The current core contracts are explicit, but an operator still needs installed host
hooks to connect them. That is a more useful next test than adding counters or loops.
Use the resulting evidence to decide whether typed Wave E source/context lineage is
then the weakest boundary. Remote trust and machine migration remain independent.

No dynamic topology, general retries, distributed resource authority, pricing,
mixed profiles, compensation, exactly-once, universal rollback, stable SDK or new
language syntax is claimed.
