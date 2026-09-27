# External TypeScript interoperability participant

Experimental, unpublished adoption rehearsal for `kujo.interop-handoff/v1alpha1`.
This package produces the generic wire format directly. It has no dependency on
Dispatch, Agents SDK, MCP, Ability, or Workcell participant implementations.
Dispatch remains the controller; a handoff is correlation, never permission.

## Package boundary

- `src/codec.ts`: independent portable encoder, strict wire/schema parser, reference
  calculation and exact host-snapshot comparison.
- `src/participant.ts`: external process using an inherited local IPC host channel.
- `src/record.ts`: recording-only worker for a surviving host after completion loss.
- `assets/`: pinned published contracts, vectors and one owner extension schema.
- `host/runner.mjs`: operator integration **fixture**, separate from the participant
  library. It invokes the existing Workcell action and owns admission/storage.

The package can be copied outside this checkout. Build/test needs only Node and its
pinned npm dependencies. The real integration fixture additionally needs Dispatch,
Workcell, Git and a compatible Kujo source runtime. It is not a publishable general
Git executor or an authentication service.

```sh
npm ci --ignore-scripts
npm test
# From Dispatch root, after building:
KUJO_BIN=/path/to/kujo node tests/typescript_integration.mjs after_commit
KUJO_BIN=/path/to/kujo node tests/typescript_integration.mjs before_commit
```

Actual tests are offline after dependency installation. Node >=22; validated with
Node 26.7.0, TypeScript 5.9.3, Ajv 8.20.0, @types/node 22.19.0. `package-lock.json`
pins transitive integrity. Ajv is a generic Draft 2020-12 validator, not an authority
resolver. No schema download occurs. See [Node IPC](https://nodejs.org/api/child_process.html)
and [Ajv dialect support](https://ajv.js.org/json-schema.html).

## Independent interpretation and codec

[interpretation.md](docs/interpretation.md) was written before participant coding
from published material. This is implementation independence, not an assertion that
the engineer had no prior ecosystem context. No existing participant code was
translated. Packaged contract bytes and their SHA-256 values are in
`assets/manifest.json`; their source revision is Dispatch
`ce7b4e385a8d47b39177999b8822a844c68489ba`.

`parse` requires exact UTF-8 canonical wire: parsing then re-encoding must reproduce
all bytes. This rejects duplicate members, reordered keys, whitespace and alternate
escapes. It rejects unpaired surrogates, invalid UTF-8, unsupported values and
unknown extension vocabularies. `match` checks the full host-expected snapshot.
Neither function knows replay policy or infers effect truth.

Bounds: 6144-byte document, 2048-byte core projection and each extension, 128-byte
identifiers/flat values, at most 16 extension fields. The portable encoder additionally
limits depth to eight, containers to 64 members and encoding to 8192 bytes.
The handoff accepts the registered participant extension and nullable existing Git
extension only. Additional families require explicit trusted registration, not an
arbitrary metadata map. References are exact `sha256:` plus lowercase hex, not URLs.

## Closed participant extension

Namespace: `kujolang.typescript-process`, operator-registered under Kujo ownership.
Schema: `kujolang.typescript-process-correlation/v1alpha1`.

```json
{"schema":"kujolang.typescript-process-correlation/v1alpha1","values":{"call_id":"native-call-1","process_instance_id":"opaque-process-id"}}
```

`call_id` is caller correlation, not admission. `process_instance_id` is participant
process attribution, not a trusted OS PID or authenticated identity. The host assigns
an independent `participant.invocation_id` after claiming admission. All three are
bound by the owner callback to retained host facts and the execution result.

The existing `workcell.git-correlation/v1alpha1` extension contains only its opaque
Workcell effect alias and profile-specific transaction commitment. Its semantics
remain with Workcell; the participant treats it as host-supplied correlation.
No target/ref/repository/command/policy is placed in the handoff.

## Host API and trust boundary

The only caller request is the closed `{call_id}` object, <=512 bytes. No Dispatch
IDs, configuration, roots, verifier, principal, assurance or effect parameters are
accepted. A trusted installed parent creates the child with a private inherited IPC
channel and an empty environment. The child cannot choose its host callback.

The bounded request protocol is sequential `{n,op,data}`:

1. `admit`: call ID and newly allocated process identity; host atomically claims a
   durable one-use ticket and returns the host-owned generic context.
2. `record`: participant validates and encodes an `unknown` handoff; host requires an
   exact expected document and records content-addressed bytes before mutation.
3. `execute`: null data; host rechecks ticket expiry/current attempt, invokes the
   fixed Workcell action, and returns the resulting reporting context.
4. `record`: native generic terminal report; no participant retry exists.

Host responses match the request sequence. RPC timeout is 15 seconds; host child
lifetime is 20 seconds; Workcell subprocess is bounded to 15 seconds/8192 output
bytes. Timeout means no usable report, not no effect. The host serial state machine
rejects duplicate/out-of-order callbacks. Ticket consumption uses exclusive creation
and fsync; retries need a fresh controller-issued ticket. Four competing processes
exercise this boundary. Current-attempt/expiry checks occur again before execution.

The operator root, action, executable, Git repository and evidence store are outside
caller input. Reads use confined names, `O_NOFOLLOW`, byte bounds and rehashing;
artifact writes are exclusive and fsynced. Parent directory ownership remains an
operator responsibility. This is a trusted local-host model, not same-UID/root
isolation or remote authentication. The fixture's crash mode is operator test setup,
not a participant request field.

## Completion loss and authoritative evidence

The test kills the actual TypeScript child before CAS or immediately after the real
Workcell action commits. The surviving host observes Workcell state without replaying
it, creates the final authoritative execution result, and launches a fresh
recording-only TypeScript worker. That worker encodes a native generic `unknown`
handoff. It cannot invoke the effect. SIGKILL and phase are durably recorded.

The pre-execution provisional artifact is retained unchanged. It is not the final
authoritative result: the live beta predicate requires the result's enforcement
reference to bind the actual Workcell observation. Finalization occurs before the
controller accepts the action result. Later assurance selection creates another
handoff referencing the same exact final result and selected assurance; it never
rewrites historical artifact bytes.

`reported` means a usable terminal report was observed, including an error.
`unknown` remains unknown after readback even when Workcell proves a commit.
Neither value establishes replay safety. Only Dispatch's locked persisted
required/deny beta path resolves live Git evidence and admits a fresh execution.

## Dispatch integration

`tests/typescript_registration.kujo` is an operator-installed **extension validator**:
closed owner fields must match retained identities and the result. The test controller
passes that callback, authoritative result bytes, selected assurance and current
subject into the existing `correlate_interop_handoff` API. No `src/adapters` reader,
generic-core branch, assurance verifier, schema or replay policy was added.

The fixture pins its host/compiled participant/registration/manifest/lockfile in the
existing verifier configuration revision. Changing code or lock bytes blocks the
old run. Manifest checks detect changed schema bytes; an operator must protect the
manifest and installed dependency tree. Lock integrity is installation evidence,
not a runtime sandbox against a hostile package installer.

See [retained adoption evidence](../../docs/audits/wave-d-typescript.md) for real
process results, security review and complete validation. No npm publication,
remote trust, generic retry engine or stable contract promotion is included.

## Packaged specification provenance

Snapshot-relative links inside copied specifications retain their original source
spelling; use this mapping when reading the standalone package. Copies are exact
bytes, not rewritten documents.

| Packaged asset | Published source at the pinned Dispatch revision |
|---|---|
| `assets/interop-handoff.md` | `docs/interop-handoff.md` |
| `assets/core.schema.json` | `docs/contracts/interop/kujo.interop-handoff.schema.json` |
| `assets/git.schema.json` | `docs/contracts/interop/workcell.git-correlation.schema.json` |
| `assets/portable-commitments.md` | `docs/contracts/portable-commitments.md` |
| `assets/commitment-vectors.json` | `tests/vectors/commitments.json` |

`assets/participant.schema.json` is the new participant-owned closed vocabulary.
Workcell's normative live predicate remains owner-published in
`workcell/docs/contracts/git-assurance-profile.md`; the TypeScript codec does not
load or implement that verifier. Only the host integration needs a Workcell checkout.
