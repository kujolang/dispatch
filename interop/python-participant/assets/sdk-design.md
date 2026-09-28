# Experimental participant SDK design

Status: alpha, unreleased, unpublished. API/conformance identity:
`kujo.participant-sdk-conformance/v1alpha1`. Supported wire:
`kujo.interop-handoff/v1alpha1`. These versions evolve independently.

## Evidence before API design

Baseline Dispatch `0ca34ec9769b07254c1f4db385cecae6efbfd6d5`, Kujo
`6ab4121a1e43a93353d10a74a754d4e9e3a5c094`, Workcell
`1940da0639b70b702c1b1077dda51ca39b065216`. Source comparison precedes this prototype.

| Concept | TypeScript before extraction | Python before extraction | Ownership |
|---|---|---|---|
| Portable encoding | `encode` returns string | `encode` returns bytes | Common exact-byte API; independent codecs retained |
| Strict parsing | `parse` checks canonical equality/schema | `parse` rejects duplicates then checks equality/schema | Common |
| Content address | `ref` hashes string/Buffer | `reference` hashes bytes | Common byte-only SDK API |
| Owner checking | Hardcoded closed TS/Git schemas | Hardcoded closed Python/Git schemas | Installed owner registration; host responsibility |
| Snapshot comparison | `match` full canonical equality | `match` full canonical equality | Common correlation, never admission |
| Participant | Node inherited IPC and random UUID | Private inherited socket and UUID | Runtime-specific transport/lifecycle |
| Admission/execution/storage | Separate operator host | Separate operator host | Host-only; not SDK policy |
| Completion loss | Fresh record.js worker | Fresh recording-only mode | Pure recorder needs no admission/effect capability |

The existing codecs remain independent, with their original proof APIs available.
SDK consumers use a factory with an immutable, operator-installed closed registration.
There is no global mutable plugin registry and no payload-driven registration.

## Two layers

1. Pure handoff library: canonical encode/parse, exact-byte address, installed closed
   extension validation and host-expected snapshot comparison. Packaged, hash-pinned
   contract assets are loaded at package bootstrap. Calls do not read evidence,
   resolve content addresses, launch processes, access networks or mutate host state.
2. Recording helpers: pure construction of new immutable wire from a trusted host
   snapshot. They contain no admission, storage or execution callback. The existing
   host remains responsible for ticket consumption, durability acknowledgement,
   execution and readback. A callback-based `execute` convenience is deliberately
   omitted: both proven runtimes already express it outside the SDK.

An SDK instance is not a security sandbox. Trusted host composition installs its
registration and supplies snapshots. A caller able to replace this code/trust root
is outside the local model. JSON input cannot install code or context.

## Language-neutral surface

| Operation | Input | Output | Side effects / trust |
|---|---|---|---|
| Create codec | One participant namespace + closed participant spec; optional closed effect spec | Immutable codec instance | Host startup only; invalid registration rejects |
| Encode handoff | Complete structured handoff | Canonical UTF-8 bytes | Validates all fields; no normalization of wire input |
| Parse handoff | Exact bytes | Validated detached value | Canonical equality; no evidence lookup |
| Content reference | Exact bytes | `sha256:` + lowercase hex | Hash only, no URL/path handling or authorization |
| Match expected | Exact wire + complete host snapshot | `match` or bounded mismatch code | Both validated; includes knowledge/extensions; not admission |
| Provisional | Host snapshot whose knowledge is `unknown` | Validated bytes | Rejects reported; never overwrites history |
| Terminal report | Host snapshot whose knowledge is `reported` | Validated bytes | Usable report including error; not effect success |
| Finalize after readback | New complete host snapshot with explicit knowledge | Validated bytes | Recording-only; does not perform/verify readback |

No function infers completion from exit codes or verifier truth. `unknown` remains
unknown after a lost report even when a host verifier observes a commit. A receipt
error may be `reported`. Finalization does not change knowledge or refs itself.
The host may select assurance later by supplying a new snapshot; a new content
address results. Existing bytes are never overwritten by SDK functions.

## Closed registrations

Registration selects exactly one namespace/participant schema and at most one effect
schema, with explicitly enumerated flat fields. Supported field validators in this
prototype are `identifier`, `sha256` (raw lowercase hex), `reference`, and
`nullable_identifier`. No arbitrary strings/maps/arrays, remote schemas, paths,
code strings or dynamic plugin loading. Owner semantics beyond these types remain
in the host/Dispatch owner validator. A successful SDK parse proves shape/correlation,
not the owner's effect predicate. This limited vocabulary fits both proven runtimes;
adding types requires a future design review, not permissive fallback.

Unknown namespaces/schema IDs reject. Registration itself is copied and validated;
mutating its source object cannot change a live instance. Extension limits and all
wire limits remain exactly those in the generic contract. Duplicate registration
lists do not exist: one participant and one optional effect are explicit slots.

## Error boundary

Codec operations throw a bounded error code, never input data:
`invalid_handoff`, `bounds_exceeded`, `unsupported_extension`,
`invalid_registration`, `invalid_knowledge`. Invalid identifiers, references,
Unicode, JSON and closed fields are `invalid_handoff` (no unstable parser details).
Correlation returns `match`, `subject_mismatch`, `participant_mismatch`,
`result_ref_mismatch`, `assurance_ref_mismatch`, `extension_mismatch`, or
`knowledge_mismatch`. Malformed operands throw codec errors; they do not become a
correlation match. These are SDK alpha categories, not Dispatch reason codes.

## Host sequence and capability separation

Host admits a tiny request with a current one-use ticket; installs immutable context;
participant encodes provisional unknown; host durably stores it and acknowledges;
host invokes a fixed configured effect; participant records a usable report if one
arrives. On disappearance the host independently observes, finalizes the authoritative
result and supplies a new snapshot to a fresh recording-only worker. That worker can
only encode. The host correlates outputs and Dispatch resolves live assurance before
any new admission. Re-running a recorder cannot invoke an effect.

No SDK function accepts a repository, API destination, principal, verifier,
configuration revision, credentials, evidence root, retry count or replay decision.
The SDK cannot authenticate a snapshot. Only trusted host provenance establishes it.
Remote identity/authentication and hostile operator protection are not implemented.

## Conformance and packaging

The shared machine corpus is `conformance.json`; both language runners execute the
same operations and expected categories. Existing 20 frozen wire vectors and the
28-case/22-parser cross-runtime corpus remain mandatory, as do real pre/post-CAS
process loss, fresh controller and one-use contention tests. Package isolation must
copy source/build assets, pinned specs/schemas, manifest and dependency lock without
Dispatch imports. Host fixtures require the ecosystem; pure libraries do not.

Do not publish, stabilize, migrate legacy participant adapters, add remote trust,
or change Dispatch policy as part of this prototype.
