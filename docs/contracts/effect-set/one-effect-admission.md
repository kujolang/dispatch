# One selected local effect: production admission proof

Experimental, trusted single host. This additive operator API in
`src/core/effect_continuation.kujo` admits one explicitly selected SQLite effect
from a protected, paused Dispatch run. It does not schedule the effect set or
resume the parent workflow. It deliberately supports only the existing required /
deny `dispatch.sqlite-unique` beta configuration and sink family.

## Control flow

Read-only assessment → candidate identification → acquire existing run lock →
reload authoritative state → resolve exact persisted configuration → verify
complete prefix and current environment → retain exact artifacts → immutable
selection and new effect-attempt identity → journal and persist → release lock.

A separate `admit_effect` call acquires the same process-owned run lock, reloads,
reconciles the journal, checks the immutable selection and exact prior revision,
and repeats live assessment. It creates a durable exclusive one-use claim,
journals admission, persists authoritative state, and retains the lock. The SQLite
adapter obtains `BEGIN IMMEDIATE`, then invokes final revalidation before any
insert. Only the selected intent is passed to the sink. Independent readback is
journaled and persisted; the parent result is never rewritten.

`inspect_effect` is the restart observation path. It can retain independent sink
truth after a lost reply, but cannot clear a claim, execute an effect, replace a
selection or allocate another attempt. Absence after admission is not replay
permission. One selection per run is the bounded scope of this proof. A later
selection/reconciliation policy is explicitly deferred.

## Installed operator API

- `select_effect(output_root, run_id, effect_id, options)` selects exactly one ID.
- `admit_effect(output_root, run_id, attempt_id, options)` consumes that attempt.
- `inspect_effect(output_root, run_id, options)` observes without execution.

`options.assurance_host` is the existing installed configuration resolver. In
addition to its existing descriptor, implementation inventory and authority
checks, it returns an `effect_set` containing `plan`, exact `result_raw`, exact
`set_raw`, installed `registration`, `environment_ref`, live `environment_valid`,
`sink_path`, exact `intents`, and a confined `read_artifact` callback. The operator
must include adapter/resolver sources in its committed implementation inventory.
These are installed host inputs, never participant-supplied authority. The
absolute sink path is bound by each intent's target digest. The existing sink
transaction binds full intent bytes and its unique scope/key to observed truth.

The existing request must permit `retry_step`; its boundary must be open and the
run paused, with no running step. Its revision and expiry, same-filesystem
preservation and deadline, parent subject/result and attempt must match. This API
does **not** invoke the parent retry operation or reset its step.

After selection, use only `admit_effect` or `inspect_effect` for this attempt.
A rejected generic/parent-resume call is audited and advances the run revision;
that makes the immutable selection stale and admission fails closed. The API
does not rebind or replace stale selections automatically.

An optional installed `effect_boundary` lifecycle callback supports instrumentation
at the five crash boundaries. It cannot supply an admission result. All callbacks
before mutation are followed by fresh checks. Participants do not receive it.

## Durable records and compatibility

`dispatch.effect-selection/v1alpha1` is an additive host-owned record, not a
participant wire extension. Its closed output contains:

- `binding`: parent subject, exact result/set/plan references, selected effect ID
  and zero-based position, persisted config revision, registration/environment/preservation
  references and current boundary ID;
- `prior_revision` and `prior_journal` sequence/hash;
- `attempt_id`: SHA-256 of the canonical selection without this field.

Profile, authority, sink identity and eligibility evidence are transitively bound
through the exact configuration, plan and effect-set references. No redundant
clock field is added. Existing journal records provide timestamps. Selection,
plan, set, parent and observations are retained without replacement under the run.
The mutable summary `effect_continuation` has `selection`, `status` and
`observation`; the reconciler requires equality with the journal's last event.

The one-use mechanism is the existing installed-host pattern: exclusive creation,
fsynced bytes and parent directory, no replacement and no reclaim on process
exit. Kujo's existing confined atomic-write primitive implements it under the
existing advisory run lock. A durable `.claim` survives a crash independently of
the state summary. A torn publication or orphan journal record denies continuation
rather than guessing a recovery. A run with a continuation gains the required
feature `effect-continuation/v1alpha1`; historical readers reject it rather than
silently ignoring the new authority state. Current generic execution and parent
review replay also reject it explicitly.

Old alpha/beta negotiation bytes, execution-result/v1, participant vectors and
single-effect behavior are unchanged. Four new portable canonical vectors cover
selection and selected/admitted/observed summaries in Kujo, TS, Python and Go.
They do not standardize a participant admission API.

## Authority table

| Step | Information producer | Validator | Authority owner | Required durable state |
| --- | --- | --- | --- | --- |
| Parent facts and claims | Any participant / adapter | Existing v1 parser, installed host | No execution authority | Original result |
| Plan, registration, environment | Installed operator adapter | Exact resolver and live checks | Local operator configuration | Config anchor, retained plan and preservation |
| Assessment | Read-only assessor, independent sink observer | Exact references, freshness, prefix | None | Observation artifacts |
| Selection | Explicit operator call choosing one ID | Dispatch under run lock | Dispatch | Immutable selection, journal, protected state |
| Admission | Dispatch | Reload, continuity and current bindings | Dispatch | Exclusive claim, admitted journal/state |
| Mutation | Existing local SQLite sink | Final callback inside writer transaction | Previously admitted exact attempt | Claim remains consumed |
| Completion observation | Independent sink readback | Installed exact intent mapping | Truth only, no replay grant | Journaled observation and protected state |
| Restart | Fresh controller | Same loader, lock and reconciliation | Dispatch | Surviving authoritative store and evidence |

TS, Python, Go, Kujo, CLI and MCP participants remain knowledge producers. None
can choose an effect, allocate a state revision, supply a journal cursor, issue a
checkpoint, consume admission or invoke mutation through an SDK recording API.

## Crash matrix

| Point | Durable state | Sink | Reload | Allowed | Prohibited |
| --- | --- | --- | --- | --- | --- |
| A: before selection | Original paused run | A/B complete, C/D absent | No attempt | Reassess and select | Phantom admission |
| B: selection persisted | Immutable selection, selected journal/state | C absent | Same attempt survives | Revalidate and admit if unchanged | Unrelated replacement attempt, stale execution |
| C: admitted, before mutation | Consumed claim, admitted journal/state | C absent | Execution path remains uncertain | Independent inspection; retain absent observation | Treat admitted as complete; clear claim and rerun |
| D: mutation, lost reply | Consumed claim, admitted journal/state | C committed | Execution path remains uncertain | Independent inspection establishes committed | Blind replay; parent replay |
| E: observation persisted | Consumed claim, observed journal/state | C committed | Exact historical completion retained | Inspect current truth | Repeat C or implicitly execute D |
| Publication interrupted | Immutable artifact/claim or journal may lead state | No mutation before final admission | Fail closed on conflict/cursor mismatch | Explicit operator review | Automatic repair/replay |

Completed A/B are never passed to the mutation function. Unknown or stale prefix
blocks C. Choosing C never authorizes D. A committed observation is historical
truth even if a later readback changes; it is not rewritten into failure or renewed
by extending old bytes.

## TOCTOU review

| Distance | What may change | Protection |
| --- | --- | --- |
| Assessment → locked selection | State, plan, evidence, authority | Reload and reassess under actual run lock; assessor labels are not inputs to authority |
| Selection → admission | Config/registration/target/environment, result/plan/set, deadlines, attempts, state/journal | Re-resolve persisted revision, exact immutable binding equality, current sink readback, freshness and continuity |
| Claim → sink writer lock | Revocation, expiry, delayed instrumentation or SQLite contention | Revalidation after admission and after `BEGIN IMMEDIATE`, before inserts |
| Mutation → evidence | Process loss, external observation change | Consumed claim blocks replay; independent exact sink verification |
| Evidence → restart | Torn state/journal, expired facts, store loss | Existing guarded loader and journal reconciliation; no replay from observations |

The run lock coordinates cooperating controllers on one host. Installed operator
configuration/environment updates must coordinate with this same lock for a
linearizable admission decision. Hostile out-of-band replacement of the store,
adapter, database inode or configuration while trusted code executes is outside
this model. A check cannot make unrelated external systems transactional. The
SQLite writer transaction prevents another SQLite writer changing prefix truth
between final live readback and the selected insert. No network is involved.

## Remaining boundaries

Generalized production effect-set scheduling; remote authenticated trust;
malicious participant verification; remote renewal; multi-host authority;
compensation; cross-sink atomicity; stable/public SDK; protocol freeze; A2A;
machine-loss recovery; exactly-once; universal rollback remain unsolved. Renewing
stale evidence does not silently replace this selection: explicit reconciliation
for a new evidence binding remains outside the one-attempt API.

Observation is not authority. Participation is not authority. Selection is not
execution. Admission is not proof of effect. Lost acknowledgement is not
permission to replay.
