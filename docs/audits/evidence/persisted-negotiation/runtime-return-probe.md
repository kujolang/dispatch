# Unresolved runtime observation, outside admission implementation

Runtime source: Kujo 5d72aab4b99e7f8c01e4c208d6c97061934c7447, optimized build.
Binary SHA-256: 4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93.

Copy runtime-return-probe.kujo.txt to a .kujo file and execute with that binary:

- default VM: exit 4, `[KUJOVM001] [vm] Runtime Error: Stack underflow in return`, call stack verify_subject;
- `run --interpreter`: exit 0, `{"ok":true}`.

Reproduced independently of Dispatch, without application effects. The new test
controller avoids the affected early return inside its field-comparison loop by
accumulating a boolean. No runtime fix or claim of current source-build verification
is made. Investigate the VM/compiler return path with this exact reproducer before
using the result to infer a broader class of failures. This is not an environmental
failure and was not suppressed in any gate.

Follow-up: the newly built current Kujo 8ae1e285999b241a48536dc2eeca5ad81c4cfd28
(debug profile, docs-only working changes) also reproduces the early-return VM error
and interpreter success. The affected production replay-check loop uses an accumulated
answer instead of early returns; the full regression gate covers its behavior.

A second minimized probe, runtime-nested-assignment-probe.kujo.txt, produces VM
stack underflow and interpreter `Complex index assignment not yet supported` on
that current build. The fixture now updates one dictionary level at a time. This
is already tracked in SignalBox sig_ff7d3cd8-d044-42cf-b9d8-fbfd8f103f7d; no duplicate
Capture or Signal was created. Unsupported syntax is not part of the new contract.
