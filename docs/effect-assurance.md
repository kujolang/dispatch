# Effect assurance prototype

Status: design validated against SQLite and Git local adapters; opt-in prototype,
unreleased. Broad migration is unscheduled. This is not completion of Wave C.
The source/trust audit and original plan are in
[audits/effect-assurance-prototype.md](audits/effect-assurance-prototype.md).

## Compatibility and ownership

`kujo.execution-result/v1` is unchanged. `retry_is_effect_safe` retains its behavior:
none permits; local_reversible permits except started/unknown; external_idempotent
permits with nonempty key, enforcement source and evidence reference **including
unknown completion**; external_non_idempotent and destructive reject. No new rule
says all unknown completion is unsafe. Empty effects reject; the existing absent
result fallback remains. Compensation metadata alone does not change these rules.

The additive experimental schema is
[dispatch.effect-assurance/v1alpha1](../schemas/effect-assurance-v1alpha1.schema.json).
It is a Dispatch-local consumer profile, not a negotiated ecosystem standard.
`src/core/effect_assurance.kujo` adds an explicit embedding API; CLI and existing
runner admission do not automatically consume producer assurance. Opt-in hosts
must call `prepare_assured_continuation`, with surviving authoritative state and
an authenticated decision, before execution. A successful resolution is not a
bearer token and must not be cached as `safe=true`.

Dispatch owns the decision. The adapters own live sink observations and execution
constraints. Workcell's Git prototype is separate from preservation/reexecution.
Kujo runtime, Watchdog, RunLedger, Eval, SDK/MCP schemas remain unchanged.

## Minimum binding derived from two adapters

A closed, flat document contains one effect, one evidence digest, and no nested
payloads. Maximum 8,192 UTF-8 bytes; identifiers are ASCII and at most 128 bytes;
digests are lowercase 64-character SHA-256; opaque evidence refs are exactly
`sha256:<digest>`. The result is bounded to 1 MiB and exactly one effect for this
prototype. Multi-effect admission is deliberately unsupported rather than partly
validated. No evidence URL/path is fetched.

| Fields | Meaning |
| --- | --- |
| schema | Independently versioned experimental consumer profile |
| run_id, step_id, attempt_id, effect_id | Exact source attempt; additionally bound to current state, control boundary and continuation target |
| result_sha256 | Exact original result bytes, not a reserialized JSON digest |
| operation | create or update in these two adapter profiles; not replay class |
| target_sha256 | Operator-mapped logical resource identity; not a raw path/URL |
| scope_sha256 | Account/environment/transaction namespace selected outside producer JSON |
| key_sha256 | Hash of the exact v1 idempotency key |
| request_sha256 | Essential addition: same key with changed operation input must conflict |
| precondition_sha256 | Expected old state, separate from desired postcondition/input |
| transaction_sha256 | Digest of the exact bounded sink intent; scopes target, key, input, precondition and validity |
| reported_state, observed_state | Original v1 completion remains unknown; live observation can establish committed or not_started without rewriting history |
| replay_class, mechanism | Existing v1 class plus checked adapter mechanism; not a generic safe boolean |
| issuer, assurance | Attribution checked against independently configured executable mapping |
| valid_from, valid_until | Integer UTC seconds; half-open interval, maximum one hour; equality at expiry rejects |
| evidence_ref | Digest of bounded sink observation, compared against live reconstructed facts and the original result reference |
| compensation | Fixed not_evaluated, never inferred from an available rollback operation |

Input, scope and precondition binding are required even though v1 does not encode
them: they come from operator-owned invocation context and are checked by the
adapter against its configured sink intent. Never populate trusted expected
context or the adapter registry from the assurance document. Result attempt
number and subject attempt ID must agree with the current control attempt.

The assurance file's independently expected SHA-256 protects transport bytes.
Semantic comparisons use Kujo's deterministic JSON representation within this
consumer. This is not JCS, a signature format, or a cross-language canonicalization
standard. Reformatting result JSON changes its subject digest. A result hash is
not producer authentication. Do not insert assurance into already-hashed result
bytes: retain the original artifact and journal the additive assurance reference.

## Trust and authentication

Claimed and observed are useful provenance labels but insufficient for this
opt-in replay path. Adapter-attested means an authorized adapter supplies bound
facts through the configured local function/channel. Independently-verified means
a separate readback of sink state, as exercised here, rather than trusting the
producer's reply. It does **not** mean a separate organization, hardware root,
cryptographic signature, or freedom from common adapter bugs.

These are provenance categories, not a total ranking: an independent read may
prove existence but not enforce future deduplication. A useful final standard
should carry provenance method, authenticated authority, verified predicate and
scope, rather than make one assurance adjective authorize every fact. This
prototype requires live enforcement verification for both admitted categories.
Unknown types, missing mappings and downgraded claims fail closed.

The host-installed mapping chooses the verifier using expected issuer identity;
it never dynamically executes/fetches an issuer or evidence URL. JSON saying
`issuer=git-local` is insufficient. Configured repository/database paths, code,
credentials and clock remain operator authority. Actor metadata remains
attribution, not authentication. Untrusted workloads must not modify that mapping,
state, sink namespace, clock, or adapter code. Local same-user processes are not a
security isolation boundary.

## Adapter semantics and crash matrix

SQLite uses a unique `(scope,key)` row and a logical effect row in one FULL/WAL
transaction. The stored intent must match byte-for-byte; conflicting requests
roll back. Git uses one ref transaction for an immutable intent marker and a CAS
target update. A moved target rejects. Both validate expiry at mutation admission,
not only when Dispatch resolved the document; delayed replay cannot reuse an
expired guarantee. Records are not deleted/recycled on expiry.

| Crash / evidence | Known | Uncertain | Admission |
| --- | --- | --- | --- |
| SQLite killed before COMMIT | Reopened DB has no committed key/effect; killed writer quiesced | Original response lost | Permit exact idempotent replay under existing class rule |
| Git killed before ref transaction | Target is original; no marker; an unreachable intent blob may remain | Original response lost | Permit exact CAS/idempotent replay |
| Either killed after commit before reply | Separate process finds exact transaction and postcondition | Original result remains unknown | Permit existing external_idempotent exception with live verification |
| Effect may have committed, no trusted verifier | Producer claims only | Enforcement/completion unestablished | Block |
| Uncertain external_non_idempotent | A sink can even show committed | No admitted idempotency contract for this class | Existing policy blocks |
| Same evidence at/after expiry | Historical record exists | Current authorization expired | Block; sink also rejects delayed execution |
| Changed subject/input/target/transaction or moved Git target | Binding/postcondition mismatch | Evidence does not establish requested replay | Block; state remains unchanged |

The precommit absence proof is only valid after the fixture has killed and waited
for the original writer. Absence during a concurrent in-flight operation is not a
general proof of failure-before-commit. Unique-key/CAS enforcement remains necessary.
Git multi-ref publication is not presented as a universally linearizable read
snapshot; inconsistent observations reject. These are process-loss fixtures, not
power-loss, remote service, multi-host or hostile-store certification.

## Reproduction and evidence

Requires Node, Git, sqlite3 CLI and the Dispatch pinned source runtime (the runtime
used for recorded evidence has unchanged source from Kujo 5d72aab). Workcell must
contain the experimental adapter; CI pins Workcell
`b34c26c90a8626c988a4234fd2610dcf11df1634`.

```bash
KUJO_BIN=/path/to/source/kujo WORKCELL_ROOT=../workcell \
  node tests/effect_assurance_integration.mjs
KUJO_BIN=/path/to/source/kujo DISPATCH_OFFLINE_FIXTURE=true \
  bash scripts/run_release_gate.sh
```

The harness writes `tests/tmp/effect-assurance-*/proof.json`, original result and
assurance bytes, and actual Dispatch state/journal records. Start, assure and resume
run as separate controller processes. Child adapters reach explicit transaction
boundaries and are killed with SIGKILL before replying. Golden paths use real
Dispatch workflows, review decisions, existing continuation, descendants and
journal reconciliation. No mocked success substitutes for a sink mutation.

Bounds, malformed documents, wrong subjects/results/targets/scopes/transactions,
expiry, missing/forged issuers, conflicting documents, claim downgrade, malicious
references, path traversal, symlinks and privacy are tested. Diagnostics contain
fixed reason codes and concise text, never arbitrary payloads. Raw business data
is confined to the actual sink; assurance carries digests and fixed facts only.
Digests of low-entropy values can still enable guessing; production adapters should
use opaque resource identities and appropriate keyed commitments when required.

## Compensation and next slice

Keep supported, requested, executed and verified compensation separate. Neither
this prototype nor v1 compensation metadata proves reversal. No compensation is
executed here.

Keep an additive document; two local families provide no reason for result/v2.
Next: negotiate the same bounded verified predicates through the existing Ability
application-owned gateway (SQLite idempotency begin/complete and commit_failed),
with authenticated principal/tenant binding and an atomic replay-time authority
check. Add contention, revocation, lease expiry during delayed admission, incomplete
receipt commit and multi-effect all-or-nothing admission tests before integrating
assurance with the default runner. Remote authentication/signing and migration of
legacy trusted integrations need explicit compatibility design. Do not silently
strengthen or weaken legacy v1 under the same schema.

The opt-in profile currently uses Dispatch's decimal control-attempt identity
(`"1"`, `"2"`, ...). General v1 producers may use opaque attempt IDs such as
`attempt-1`; mapping those identities requires another explicit adapter profile.
The resolver deliberately does not silently reinterpret them. Likewise, this
resolver is for external-idempotent effects, not a replacement for none/local
reversible admission or evaluator-only replay.

## Application-owned Ability profile (experimental)

The third family is `ability_application_gateway`, a profile with separate
business and replay-receipt commits. `src/adapters/ability_assurance.kujo` invokes
only an operator-configured local gateway with a separately supplied session
credential. It compares live application profile identity before returning an
observation. Unknown receipt completion does not erase a verified business commit.
Application denial codes are allowlisted; arbitrary callback text is discarded.

The Ability profile's fixed digest fields fit the existing envelope. The one
additive mechanism enum distinguishes dual commits from the original SQLite
single-transaction sink. Stable execution-result/v1 and retry_is_effect_safe
remain unchanged. This is not a stable assurance release or a global default.

`run_workflow_with_admission` is an experimental host-only callback API. It reloads
state under the existing run lock, reconciles the journal, calls trusted admission,
and executes without releasing that lock. It accepts a function, never a producer
JSON decision. The Ability fixture uses prepare_assured_continuation in that
callback; gateway mutation independently rechecks live authentication, expiry and
owner fencing. There is no atomic transaction across Dispatch and the application.

Run `KUJO_BIN=/reviewed/source/kujo bash tests/ability_assurance_integration.sh`.
Set ABILITY_ROOT for a non-sibling checkout. The canonical release gate includes
this test alongside existing SQLite/Git assurance, failure and durable-review tests.
See Ability `docs/audits/application-assurance.md` for the dual-commit matrix,
authentication boundary, bounded profile and compatibility recommendation.
