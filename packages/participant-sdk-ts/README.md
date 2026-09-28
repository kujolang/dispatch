# Experimental participant SDK

Alpha, unreleased and unpublished. API changes may break consumers. Supports
`kujo.interop-handoff/v1alpha1` and `kujo.participant-sdk-conformance/v1alpha1`.

This library encodes, parses, hashes and correlates bounded evidence and records
participant knowledge (`unknown` or `reported`), never effect truth.

The SDK does **not** authorize execution, consume Dispatch tickets, choose or
execute effects, retry effects, authenticate principals, select assurance
profiles, verify effect truth, decide replay, or resolve content references.
The trusted local host/controller owns those responsibilities, configuration,
evidence storage, extension registration and the expected snapshot.
A valid correlation match is **not permission to replay**.

No network schema resolution, dynamic plugins or installation scripts. Bundled
assets are checked against a code-pinned manifest. This detects asset corruption;
it cannot protect against an attacker replacing the package and its checks.
Install only operator-pinned artifact bytes and dependencies. Package names are
proposed identities, not a claim of registry ownership. Do not install by name.

See API.md. Package version is independent of wire and conformance versions.
Private modules are implementation details, never supported imports.

ESM only; Node >=22. No CommonJS entrypoint. Install the local tarball.

## Minimal recording-only example

```typescript
import {createCodec, contentRef} from '@kujolang/participant-sdk';
const codec = createCodec({"namespace": "example.process", "participant": {"schema": "example.process-correlation/v1alpha1", "fields": {"call_id": "identifier"}}, "effect": null});
// In production this snapshot comes from the trusted host.
const expected = {"schema": "kujo.interop-handoff/v1alpha1", "subject": {"run_id": "run-1", "step_id": "action", "attempt_id": "1", "effect_id": "effect-1"}, "participant": {"namespace": "example.process", "invocation_id": "invocation-1"}, "completion_knowledge": "unknown", "execution_result_ref": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "assurance_ref": null, "participant_extension": {"schema": "example.process-correlation/v1alpha1", "values": {"call_id": "call-1"}}, "effect_extension": null};
const bytes = codec.provisional(expected);
codec.matchExpected(bytes, expected); // correlation only
console.log(contentRef(bytes));
```
