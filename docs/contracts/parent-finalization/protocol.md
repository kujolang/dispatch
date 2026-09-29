# Bounded parent finalization (experimental local host)

The installed operator API separates `assess_parent_finalization` from
`finalize_parent`. Both take the existing run store/root and identity. Assessment
returns informational JSON; finalization additionally requires the exact candidate
and a current v2 `approve_override` review decision accepted by the installed host.
There is no participant finalization method and no implicit CLI module loader.

## Scope and prerequisites

Opt in through the persisted step configuration's `parent_finalization` contract:

```json
{
  "schema": "dispatch.parent-finalization-policy/v1alpha1",
  "required_outputs": ["report"],
  "evaluation": {
    "name": "eval",
    "version": "2.0.0",
    "configuration_sha256": "<exact configuration SHA-256>"
  }
}
```

`evaluation: null` explicitly declares no evaluator. The anchored workflow owns
this choice. Required outputs are named entries of the original result's `output`;
each value commits exact evidence-ref/v1 metadata bytes. The installed host supplies
bounded metadata and content bytes; SHA-256 integrity and exact subject must match.
A declared publication acknowledgement is another required output artifact. No
publication obligation is imposed on contracts that do not declare one.

This slice finalizes one last unresolved parent in a protected required/deny beta
run. The producing step remains paused at postcondition review. A required state
feature makes older controllers refuse this state. Generic resume/approve override
cannot skip finalization. Legacy selections are not migrated.

All of these predicates must hold together:

- Exact run revision, journal and immutable workflow/configuration authority.
- Fresh effect-set assessment after the last terminal effect observation; every
  planned effect independently committed. No optional-effect semantics are invented.
- Every noncancelled selection consumed and independently observed committed;
  cancelled selections remain historical and cannot stand in for required effects.
- Required outputs exist with exact committed metadata/content and subject.
- Required evaluation is complete, produced by the configured evaluator, and names
  exactly the original result digest followed by required output content digests.
- Existing Dispatch control policy resolves evaluation to continue/fail/cancel.
  Retry/intervention remains a blocker; finalization runs no evaluator or repair.
- Current preservation/environment and reference identities remain valid.
- Every other required step is completed; optional skipped steps retain existing
  semantics. Pending descendants or unrelated required work block this bounded API.
- Current allowed revision-bound operator decision, accepted by installed authority.

`continue` maps to completed, `fail` to failed, and `cancel` to cancelled. This API
introduces no new run status. Rejected, needs_changes, interrupted and unresolved
review retain their existing semantics; they are not fabricated success outcomes.
The historical execution result is never rewritten, including indeterminate status.

## Preservation identity

The historical portable-json/v1 recipe remains unchanged for existing inline
preservation. Its key grammar intentionally rejects `$ref`; widening it would
change a historical contract. An explicitly installed additive binding instead
commits `dispatch.preservation-binding/v1alpha1`: exact original document hash,
subject, environment identity and ordered reference selector/metadata/content hashes.

The resolver belongs to the installed trusted host. Every producer `$ref` must map
to authorized bounded evidence. The binding code performs no URL fetch or path
interpretation. Unknown/malformed references, missing content, wrong subject,
environment or digest fail closed. Workcell owner/materialization observations
bind retained workspace identity and Git HEAD; directory existence alone is not
sufficient. Original document and evidence bytes are retained separately from the
portable commitment. Renewal does not silently change an anchored environment.

Preservation must remain valid through the terminal decision in this slice. The
terminal receipt remains historical when preservation later expires. Finalization
neither extends retention nor performs cleanup; ordinary Workcell cleanup ownership
continues afterward, and reading the receipt does not require preserving a process.

## Authority and durability

| Step | Information producer | Validator / authority | Durable prerequisite |
| --- | --- | --- | --- |
| Effects | Participant claims, independent sink observation | Dispatch installed verifier | Original result, plan, lifecycle, claims, fresh evidence |
| Environment | Workcell owner observer | Installed host + Dispatch binding | Original preservation and reference identities |
| Outputs | Action/artifact producer | Installed bounded resolver + Dispatch | Original committed evidence-ref and matching bytes |
| Evaluation | Eval | Dispatch existing policy | Exact input identities, evaluator/config identity |
| Review | Local operator | Existing v2 validator + installed authorization | Matching request, boundary and revision |
| Candidate | Dispatch read-only assessor | No execution or terminal authority | Informational exact-source commitment |
| Terminal decision | Dispatch under actual run lock | Exact fresh revalidation | Immutable control event before state publication |
| Reconstruction | Operator-selected recovery plan | Existing locked reconciler | Complete event, exact predecessor and retained artifacts |

Finalization retains prerequisite raw artifacts, fsyncs them, appends the existing
immutable control record and JSONL index, then publishes state last. The event
records source state/revision/journal, candidate, subject, outputs/evaluation/review,
preservation/effect bindings, outcome and resulting revision. No second audit
system is introduced. Artifacts without a control event are not terminal authority.

The lock serializes Dispatch controllers. Installed sink/environment observers
provide a current verified snapshot; this does not create cross-sink atomicity or
protect against malicious host/storage mutation. Freshness and source pins are
rechecked at the final locked boundary. External artifacts are committed by their
exact retained bytes, not by a promise that mutable paths can never change again.

## Crash and contention contract

| Boundary | Durable facts | Reload / permitted action | Prohibited |
| --- | --- | --- | --- |
| Before finalization event | Effects, outputs, Eval and review prerequisites | Remains paused; fresh assessment | Infer terminal state from eligibility |
| Immutable event before index/state | Exact decision and predecessor survive | Explicit recovery plan/apply reconstructs terminal view | Duplicate decision or replay effects |
| Terminal state before reply | Decision and state survive | Fresh reader reports already finalized | New logical finalization |
| Two fresh finalizers | Same assessed source | Actual run lock permits one exact transition | Test-only lock or duplicate terminal event |
| New child/state/config/evidence change | Candidate becomes stale | Reject and reassess | Cached candidate as authority |

Recovery validates terminal artifacts and the source identity. It does not rerun
live evaluators or reinterpret old evidence after expiry to erase a completed
historical decision. Torn/conflicting/corrupt history continues to fail closed.

## Remaining boundaries

General parent/descendant composition, a general scheduler, arbitrary parallel
effects, legacy selected-state migration, mixed profiles, distributed recovery,
machine-loss recovery, hostile storage, remote authentication, multi-host authority,
compensation, exactly-once, universal rollback, and public/stable participant SDKs
remain outside scope. See [Wave F crosswalk](wave-f-crosswalk.md).

Ordinary execution failures and cancellation can still use existing Dispatch
failure policy before entering this postcondition-finalization path. Opting in
does not turn an execution failure into success. A producer success report that
would otherwise continue is routed to finalization review. The bounded API is
specifically for the surviving protected review boundary, not a replacement for
all runner terminal/error paths.

## Installed API shape

`options.assurance_host(revision, state)` remains the exact installed authority
resolver. Its returned `effect_set` may explicitly supply:

```text
preservation_binding:
  document_raw: exact original preservation document string
  environment_ref: expected installed environment commitment
  resolve(selector): {metadata_raw, content_raw, environment_ref}
```

Only the host's bounded allowlist maps selectors. Evidence metadata uses existing
`kujo.evidence-ref/v1`, exact subject, and `integrity.status = sha256`. Up to 16
references and 4 MiB aggregate bytes are accepted. Individual content is at most
1 MiB; metadata at most 16 KiB; the original document at most 64 KiB.

The same installed record supplies:

```text
parent_finalization:
  read_output(committed_metadata_ref): {metadata_raw, content_raw}
  evaluation_raw: exact existing evaluation-result/v1 bytes, if required
  authorize_decision(decision, current_state): boolean
```

The host must pin the executable verifier/resolver/authorization closure through
its existing implementation/authority configuration. Producer JSON cannot install
these functions. The fixture is an installed local host example, not a portable
participant API or remote authentication claim.

Call `assess_parent_finalization(root, run_id, decision, options)` to obtain an
informational candidate. The response distinguishes `eligible`, `already_finalized`,
`requires_review`, `blocked_by_uncertainty`, and other `not_eligible` reasons. It
changes no authority. Call `finalize_parent(root, run_id, candidate, decision,
options)` explicitly; it returns `finalized` or a rejection/stale-state reason.
Candidate and durable receipt have separate experimental v1alpha1 schema names;
existing participant wire is unchanged. The API is for installed controller code,
not a generic command accepting an arbitrary verifier path.
