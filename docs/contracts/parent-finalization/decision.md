# Parent finalization: pre-implementation decision

Status: design from current source, before source changes and before the new proof.
Baseline heads: Dispatch `27bbcb5a231cbc75a67a96a5bb13a76a9bf9b0a3`,
Workcell `1413e44e287662575322c7052d744b29d4e983bb`,
Kujo `6f8b00ff7551160fd6d8c9550e3f39639d76a027`.

## Existing authority

| Fact | Existing owner / record | Finalization obligation |
| --- | --- | --- |
| Run and step | Dispatch state store, initial workflow/input policy anchor | Reload under actual run lock; exact revision and journal |
| Parent result | execution-result/v1; retained original `.parent` bytes | Preserve original indeterminate result and subject; never rewrite it as success |
| Required effects | Immutable ordered effect plan, lifecycle and sink observers | Fresh complete assessment; no unresolved admitted or selected work; claims remain consumed |
| Outputs | Execution result's `output`, step output/schema, evidence-ref/v1 | Explicit contract names required artifacts; verify their committed content identities |
| Evaluation | Eval evaluation-result/v1 and `input_evidence_ids` | Bind exact parent result and output digests, subject, evaluator configuration; use Dispatch control policy |
| Review | Current boundary and intervention-request/decision v2 | Explicit currently allowed operator decision, separate from informational eligibility |
| Descendants | Existing `depends_on` closure and control barrier | No required pending/blocked/running descendant may be treated as completed |
| Preservation | Workcell preservation-outcome/v1, owner evidence/workspace | Verify required current retention separately from effect truth |
| Terminal status | Existing completed/failed/rejected/cancelled states | No new global lifecycle enum; needs_changes/paused are not success |
| Decision durability | Existing immutable control record, JSONL index, authoritative checkpoint | Record the exact terminal decision first; state publication last |

`runner.kujo` can already mark a producing step completed before its postcondition
policy opens review. That status alone is not proof that an interrupted multi-effect
parent is safely finalized. The additive finalization decision must disambiguate
that case without changing historical execution results or replacing the runner.

## Preservation compatibility decision

The old `effect_context` commits the entire parsed preservation object using
portable-json/v1. Its fixed key grammar excludes `$ref`. Workcell deliberately emits
`$ref` entries for retained files and its owned workspace. Changing that codec or
stripping evidence would change historical commitments.

Keep the historical recipe when no new binding is explicitly installed. Add an
opt-in, domain-separated preservation binding that commits exact original document
bytes and the exact identities of separately resolved evidence. An operator-owned
bounded local resolver must map every reference; producer paths/URLs do not install
resolvers or trigger network access. Inline evidence and referenced evidence remain
distinguishable. Workspace evidence binds owner identity/materialization facts;
a directory's existence does not prove its identity or authorize repeating work.

The preservation subject must match the effect plan's run/step/attempt, the installed
environment must match, and expected metadata/content digests must be verified.
Retain original bytes. Replacing referenced content changes eligibility/binding;
renewal cannot silently change a selected environment. Add independent four-language
vectors for the additive portable preimage; historical vectors remain untouched.

## Bounded finalization decision

Use an opt-in contract within the existing persisted step configuration, protected
by the workflow policy anchor. It declares required output evidence and evaluation
requirements; no universal publication obligation is added. Required publication
acknowledgements, when declared, are independently verified evidence requirements.
The original parent result commits expected artifact identities. Eval supplies
judgment about those exact inputs; Dispatch maps that judgment through its existing
control policy. Missing outputs, stale evaluation, unknown effects and unresolved
review are blockers, not alternate success paths.

Selection cancellation does not complete a required effect. Existing effect plans
have no optional-effect flag, so every planned effect remains required; do not infer
optionality from a cancellation reason. Existing optional *steps* retain their
separate skipped-step semantics. A failure verdict is mapped by existing policy;
continue, fail, cancel and intervention remain distinct, and retry does not execute
inside finalization.

An installed operator API will expose read-only assessment and explicit finalization
with exact candidate and revision-bound review decision. The installed host supplies
verifiers; a workflow or participant cannot serialize executable authority. Ordinary
CLI paths without that installed authority must not synthesize a verifier.

Under the run lock, re-read state, current configuration, artifacts, effects,
preservation, evaluation and review. Compare the exact candidate. Append a terminal
decision through the existing control journal, then publish the terminal view. A
new required storage feature makes historical controllers refuse unfamiliar terminal
authority. No mutation callback, retry, evaluator invocation or scheduler runs here.

## Recovery and next architecture

Extend retained-host reconciliation only for this new durable terminal event. A
complete event with an exact predecessor can reconstruct its derived terminal view.
Evidence without the event leaves the parent eligible/nonterminal. A receipt or
artifact orphan alone is not a decision. Contending fresh controllers serialize on
the existing lock; one transition wins. Reply loss cannot allocate another logical
finalization. Preserve source corruption and refuse invented history.

After working proof, map these facts/policy/evidence/edges to Wave F node concepts.
Do not build a graph engine, mixed-profile authority, legacy-selection migration,
remote trust, machine migration, compensation or exactly-once semantics here.
