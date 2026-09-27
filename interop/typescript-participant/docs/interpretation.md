# Pre-code interpretation (2026-09-27)

Read only Dispatch's published interop-handoff specification, portable commitment
rules and JSON schemas before implementing the independent participant. Existing
participant source is excluded. Prior conversation knowledge is disclosed; this
is implementation independence, not a claim of personnel isolation.

The core correlates a host-owned Dispatch action subject (run/step/action attempt/
effect) to one participant invocation and exact result bytes. Attempt is a decimal
action attempt in the current consumer, not a process retry count. Participant
namespace is operator-registered attribution, not authority. Invocation is distinct
from call identity; our closed extension retains call_id and process_instance_id.

reported means usable terminal report observed; unknown means none. Neither is Git
truth or replay permission. A participant can persist unknown evidence before an
operation and die without updating it. A surviving host can retain those exact bytes;
only Dispatch plus the existing live verifier may decide continuation.

Result reference is mandatory sha256:<64 lowercase hex> of exact bytes; selected
assurance is the same kind of reference or null. These are never paths or URLs.
One required closed participant extension and at most one closed effect extension
are allowed. Reuse workcell.git-correlation/v1alpha1 without reproducing Git predicate
logic. Closed schemas supplement, not replace, explicit identity/reference matching.

UTF-8 canonical sorted-key JSON must equal the received bytes (reject duplicate
keys, whitespace, alternate escaping). Reject invalid Unicode. Limits: total6144,
core2048, each extension2048 bytes; identifiers128 ASCII bytes; flat values128 bytes,
at most16 members. No nested metadata. Registered extension names must match exactly.

Host admission/storage/effect invocation transport is deliberately outside the core.
We will use a local inherited IPC channel, not remote trust: an installed host grants
one-use context, owns storage and invokes a preconfigured action. The only caller
request is call_id. Host callbacks cannot be selected by that request. Package
code knows no Dispatch workflow/replay engine or existing participant implementation.
No contract ambiguity found at this stage; host IPC is fixture integration, not a
new universal protocol. Core/schema version remains alpha, assurance beta opt-in.

## Post-implementation evidence-ordering clarification

The first real beta readback exposed an integration ordering requirement, not a
missing generic-wire rule. The provisional pre-effect record cannot stand in for
the final authoritative result: Workcell's live observation reference must match
that result's enforcement reference. A surviving host therefore finalizes the result
after readback and invokes a fresh recording-only TypeScript worker. Original
provisional bytes remain retained, and finalization precedes Dispatch accepting the
result. Neither recording worker nor readback admits replay. No published contract
accept/reject semantics changed.
