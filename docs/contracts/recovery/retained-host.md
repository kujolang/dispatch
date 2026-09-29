# Retained-host operator reconciliation

Experimental local trusted-host contract, `v1alpha1`. Recovery is not replay;
repair is not truth; reconciliation is not admission. The retained authoritative
store, original run identity, policy anchor and immutable records must survive.
This is not restoration from a backup or authority transfer to another machine.

## Operator workflow

```sh
kujo run dispatch.kujo recover inspect RUN --output-root outputs
kujo run dispatch.kujo recover plan RUN --output-root outputs --json > assessment.json
jq .plan assessment.json > plan.json
kujo run dispatch.kujo recover apply RUN plan.json --operator local-operator --output-root outputs --json
```

Inspect and plan do not change control authority. Apply requires the exact plan
and an operator attribution. Local process/filesystem access is operator authority;
the attribution is not authentication. Apply never calls an adapter, runner,
participant, evaluator or continuation API. Ordinary review/admission is a separate
operation after repair. No force flag exists. An expired preservation interval or
revoked adapter does not prevent reconstructing history, but cannot authorize work.

The JSON envelopes identify `dispatch.recovery-assessment/v1alpha1`,
`dispatch.reconciliation-plan/v1alpha1`, and `dispatch.reconciliation-result/v1alpha1`.
They are experimental host administration data, not participant wire contracts or
new portable canonical commitments. Existing alpha/beta/v1 bytes and vectors retain
their meanings. Plans compare exact parsed content and carry a SHA-256 assessment
identity over the complete source inventory. Unknown fields or changed operations
cannot be smuggled into an accepted plan. The full plan is reproducible before
application and retained in the immutable reconciliation receipt before repair.

## Authority and inventory

| Material | Information producer | Validation / authority |
| --- | --- | --- |
| Active checkpoint | Dispatch state store | Existing backend loader and policy anchor; SQLite row wins over its JSON mirror |
| Control history | Dispatch controller | Run ID, contiguous sequence, prior hash, event digest, exact immutable record bytes |
| Lifecycle history | Dispatch under run lock | SHA-256 addressed canonical artifacts, full append-only reference prefix, prior state revision and journal |
| Consumption | Exclusive Dispatch claim | Exact original selection bytes; never deleted, reclaimed or reset |
| Observation | Sink adapter | Historical knowledge; current verification remains the family owner's responsibility |
| Preservation / reexecution | Workcell or action owner | Inventory displays retained declarations, expiry and filesystem availability; no execution authority |
| Repair plan | Local operator requests; Dispatch derives | Exact assessment identity, closed repair set; informational until locked apply |
| Repair receipt | Dispatch | Immutable artifact referenced by existing control journal, operator and source identities, resulting revision |
| RunLedger / CaseFile / Watchdog | Receipt / handoff / telemetry producers | May reference recovery evidence; never validators or continuation authority |

Inventory includes decoded authoritative state identity, state revision, journal
bytes/hash and cursor, control records, all effect artifacts (including orphans),
claims, cancellation/rebinding/observation histories, checkpoint files, prior
reconciliation artifacts, step execution/evaluation results, control boundary,
negotiated profile/configuration, and preservation/reexecution declarations.
A missing/unreadable checkpoint reports surviving bounded artifacts but permits
no repair. Inspect can observe an in-flight inconsistent snapshot; apply always
loads and revalidates under the actual process-owned run lock.

Bounds: 2,048 entries per inspected directory, 32 MiB total retained inventory,
8 MiB journal/checkpoint reads, 1 MiB control/effect records, 64 lifecycle events.
Confined reads reject symlinks/nonregular files. Unrecognized directory entries,
missing hashes or incomplete immutable chains fail closed. No producer-supplied
URL or command is followed. Workcell references do not cause materialization.

## Classification and mechanical repair

* `consistent`: no supported structural repair is needed. This says nothing about
  whether an effect may execute. Unresolved consumption/uncertainty is separate.
* `reconcilable`: a complete exact immutable chain supports the offered repairs.
* `needs_operator_review`: unindexed lifecycle-only artifacts or a nonquiescent
  boundary prevent this mechanical path. No orphan is silently selected.
* `unsupported_legacy_selection`: historical one-effect selection is readable,
  but this path does not migrate it into sequential continuation.
* `missing_required_authority`: original authoritative checkpoint/anchor unavailable.
* `corrupt_or_unsupported`: malformed bytes, conflicting duplicate, missing claim,
  ahead/divergent state, unsupported history reconstruction, or limit failure.
  The error identifies the rejected predicate; original material is retained.

Two repairs are implemented:

1. Rebuild the JSONL journal index from the contiguous exact immutable control
   records. Exact duplicate entries are deduplicated only after byte-equivalent
   identity checks. The original index is archived verbatim first. Conflicting
   duplicates and torn JSON are not truncated or repaired.
2. Advance a surviving paused checkpoint through a tail of exact sequential
   lifecycle control records. Each record must name the current revision and
   journal, extend the exact lifecycle prefix by one artifact, and pass lifecycle
   folding. Cancellation, rebinding, consumed admission and retained observation
   are restored as historical facts. A prior reconciliation receipt can also be
   completed after interruption if its full reconstructed-state hash matches.

No general event sourcing is claimed: arbitrary workflow decisions, missing
execution outputs, evaluation results or parent transitions cannot be recreated
from abbreviated journal events. State ahead of surviving history is rejected.
A lifecycle artifact without its control record remains operator review, even if
its filename is a valid digest. Multiple or conflicting candidates are never
arbitrarily chosen. A standalone consumption claim is retained as consumed
uncertainty; it is not silently promoted to a completed effect or reclaimed.

## Locked publication and interruption

Apply reloads the authoritative checkpoint, rescans every source artifact and
compares the exact plan under the same run lock used by normal admission. It
requires a paused open boundary with no running step. It writes the original
checkpoint snapshot, original index and immutable receipt, synchronizes their
directory, publishes the verified index, appends `retained_host_reconciled` through
the existing immutable-control-record path, then publishes authoritative state
last. The state/request revision advances; previous decisions become stale.

A receipt includes assessment identity, original state identity, source file
hashes, source index and snapshot references, selected repairs, operator,
unresolved facts, prohibited actions and resulting revision. No historical
immutable event/result/observation is overwritten. A repaired checkpoint can be
independently loaded by a third process. If apply dies, a new inventory is required;
the old plan cannot silently continue against altered sources. A retained recovery
control record is itself reconstructable through its exact predecessor hash.

The lock serializes cooperating local controllers. This does not protect against
privileged arbitrary writers, hostile storage, complete rollback of all surviving
stores, a changing host clock, or multiple machines. External sink/configuration
changes are not atomically locked with filesystem repair; repair grants no
admission, and the existing final admission checks remain mandatory.

## Crash and corruption matrix

| Failure | Surviving evidence | Permitted response | Prohibited response |
| --- | --- | --- | --- |
| Immutable control record before index append | Complete exact next record | Explicit index/checkpoint reconstruction | Ignore orphan and repeat operation |
| Lifecycle artifact before control record | Hash-bound artifact only | Inventory and operator review | Infer journal authority from filename |
| Journal ahead of state | Exact lifecycle tail | Reconstruct only supported fields | Invent missing parent output/history |
| State ahead of journal/records | Unprovable publication | Reject, preserve sources | Synthesize missing history |
| Torn index / conflicting duplicate | Corrupt source remains | Inspection / CaseFile packaging by operator | Truncate tail or choose winner |
| Exact duplicate index record | Identical immutable source | Archive index, deduplicate mechanically | Rewrite immutable records |
| Consumed admission, lost reply | Claim and admitted history | Reconstruct consumed; independently verify sink | Unconsume or replay |
| Observation retained, checkpoint stale | Exact observed lifecycle tail | Restore historical observation | Pretend evidence is fresh forever |
| Cancellation/rebind retained | Exact immutable lineage | Restore cancellation/current evidence basis | Recreate executable cancelled attempt |
| Preservation expires / authority changes | Historical chain intact | Structural repair; separate live review | Extend deadline or change policy |
| Reconciliation record before state publication | Exact receipt and predecessor | Replan and complete structural publication | Resume as part of repair |
| Corrupt immutable bytes / missing claim | Integrity failure | Reject | Replace with guessed bytes |

## Workcell, parent and compatibility decisions

Workcell owns preservation, materialization and Git truth. Dispatch displays
retained workspace availability and deadlines, but a directory's existence is
not evidence that repeating a mutation is safe. Git target/marker readback stays
in Workcell's existing observer. Invalid materialization references or unavailable
adapters remain unresolved owner checks; recovery does not fetch or execute them.
RunLedger correlation could carry the receipt reference without new authority.
CaseFile can package unchanged corrupt sources. Watchdog can observe an outcome.
No new integration daemon or duplicate audit store is justified for this slice:
Dispatch's existing immutable control event mechanism already records the repair.

Parent finalization remains a separate architecture slice. All child effects
complete does not establish the parent's required output, evaluation result,
publication, descendant barriers or policy review. Recovery preserves the original
parent result and paused boundary. A future bounded parent-finalization contract
must bind these predicates and record a new terminal decision without rewriting
the historical result. This is the recommended next architecture phase toward
Wave F, ahead of remote trust or machine migration.

Legacy one-effect selected state remains readable through its existing API and
unsupported for migration by this recovery path. Its lifecycle does not prove a
sequential anchor/basis/terminal lineage; defaults would fabricate compatibility.
Historical bytes and consumed claims must remain intact in any future migration.

One negotiated assurance profile per run remains unchanged. Supporting SQLite and
Git in separate runs does not establish mixed per-effect profiles. A composite
profile would need an explicit authority/registration contract; recovery provides
no evidence that relaxing run-level negotiation is necessary.

Remaining: full machine-loss recovery, distributed restore, remote authenticated
trust, hostile storage, multi-host authority, general scheduler, compensation,
cross-sink atomicity, exactly-once, universal rollback, remote renewal, protocol
freeze, A2A and stable/public participant SDK. Recovery is not replay. Consumed
work stays consumed. Uncertainty survives until independent evidence resolves it.

### Discovered Workcell selection compatibility limit

The real retained-worktree fixture uses Workcell's `create_workspace`,
`cleanup_workspace(..., true)`, preservation outcome and reexecution descriptor,
then Dispatch's existing review/checkpoint path. It proves repair with a present
workspace, actual preservation expiry during an outage, later owner cleanup,
unknown-effect retry denial and a damaged retained checkpoint. It does not certify
OCI isolation or materialization from arbitrary exports.

An attempted combination with the existing sequential selection fixture exposed
an unresolved compatibility limit: Workcell preservation evidence uses valid v1
`$ref` keys, while `portable-json/v1` permits only its published ASCII key grammar.
The selection context commits preservation with that portable codec, so this
combination rejects with `commitment_key_invalid`. Parent result bytes can remain
noncanonical, but the separate preservation binding still has this restriction.
The earlier Workcell Git selection proof used bounded synthetic preservation with
an empty evidence list; it did not establish this richer owner-evidence case.

Recovery inventory/review repair handles the real v1 preservation document without
changing its bytes. Do not interpret that as successful sequential admission of
this document. Resolving the selection binding needs an explicit compatibility
recipe and cross-language vectors; silently broadening historical codecs or
stripping owner evidence would be wrong. This is a prerequisite to a fully combined
Workcell environment/child-effect/parent-lifecycle proof, and is retained for review.
