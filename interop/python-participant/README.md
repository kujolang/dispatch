# Independent Python participant

Experimental, unpublished native implementation of `kujo.interop-handoff/v1alpha1`.
This is correlation only. Dispatch owns admission/replay; Workcell owns Git facts.

## Install and verify

Python >=3.10 (validated 3.10.5); JSON Schema 4.23.0. All six dependency versions
and wheel SHA-256 hashes are in `requirements.lock`. Wheels only; no source builds
or dynamic plugin loading. Bootstrap downloads wheels; all later tests are offline.

```sh
bash bootstrap.sh
.venv/bin/python -I run.py test
```

Copy `src/`, `tests/`, `assets/`, `docs/`, `run.py`, `requirements.lock` and
`bootstrap.sh` anywhere. No ecosystem checkout is needed for codec/schema/vector
unit tests. The separate operator host fixture additionally needs Git, Workcell,
Dispatch and its compatible Kujo runtime. Do not install the fixture as a general
Git execution service.

## Independent contract implementation

[Interpretation](docs/interpretation.md) was written before code. Source imports
only Python's standard library and jsonschema; no TypeScript, Dispatch, Workcell,
MCP, HTTP or Agents SDK implementation is imported or translated. Published
specifications/schemas/vectors are pinned exact copies in `assets/manifest.json`.
`parity.json` is a new neutral test corpus, not TypeScript-generated expectations.

`encode` implements portable-json/v1. `parse` rejects malformed/noncanonical wire.
`match` requires an exact host-supplied snapshot. `request` accepts only `{call_id}`.
`reference` hashes exact bytes; it does not read files. Duplicate keys are rejected
before dict construction. Python unlimited integers, floats, -0, NaN/Infinity,
ASCII escaping and permissive duplicate handling are deliberately not defaults.
Unicode is not normalized. Unknown closed extensions fail.

The eight core fields, 6144-byte document, 2048-byte core/extension and 128-byte
identifier/value bounds remain unchanged. The owner namespace is
`kujolang.python-process`; extension
`kujolang.python-process-correlation/v1alpha1` has exactly `call_id` and
`process_instance_id`. Neither is authority. Host allocation adds a separate
invocation identity. Optional `workcell.git-correlation/v1alpha1` carries only
Workcell effect alias and transaction commitment. No target, path or Git command.

`reported` means a usable terminal report (including error). `unknown` means none.
A zero exit or SIGKILL establishes neither commit nor absence. Live Workcell
readback owns that predicate; Dispatch owns the subsequent replay decision.

## Local host fixture

The parent starts Python with `-I`, empty environment and a private inherited
socketpair. Frames have a four-byte unsigned network-order length, <=8192 bytes,
with a 15-second participant receive deadline. Only the operator creates the
channel. There is no listener, URL or participant-selected callback.

The host reads <=512-byte caller `{call_id}`; no trust/effect parameters. Protocol:
request → admit (call/process identity) → host context → record unknown → execute
→ terminal context → record. Host validates exact phase/shape and expected wire.
Four distinct Python participant children contend; host exclusive create+fsync
claims one ticket. It rechecks current attempt/expiry immediately before mutation.
Consumed tickets cannot be reused. New execution requires new Dispatch admission.

Workcell's fixed operator-configured action is invoked through bounded argv, no
shell, empty environment, 15-second deadline and <=8192 bytes combined output.
No retries exist here. A surviving host finalizes authoritative result after live
read-only observation. A fresh recording-only Python process emits unknown after
child death; it has no execute capability. Provisional bytes remain preserved.
This requires surviving trusted host/store; no machine-loss recovery claim.

Evidence uses exclusive, fsynced SHA-256 files under a host-owned directory.
Reads reject symlinks and oversized files; artifacts are rehashed. Parent directory
ownership is trusted. No same-UID/root isolation, remote authentication or hostile
operator protection is implied.

`-I` ignores PYTHONPATH/PYTHONHOME/user site/startup variables and cwd module
shadowing. The explicit package source anchor and operator-installed virtualenv
remain trusted. System/venv site installation, including .pth files, is not a
sandbox: only reviewed hash-pinned wheels may be installed there. Tests inject
hostile environment/startup modules and verify no execution or public leakage.
Configuration revisions pin host, codec, worker, owner registration, manifest and
lockfile. Protected operator installation is still required; a lockfile alone does
not authenticate mutable runtime site-packages.

## Integration and parity

From Dispatch root after installing both independent projects:

```sh
node tests/python_parity.mjs
python3 tests/python_package_isolation.py
KUJO_BIN=/path/to/kujo python3 tests/python_integration.py
```

The parity runner calls the documented compiled TypeScript API as a black box.
Only distinct owner namespace/schema names are projected for comparing bytes,
hashes and normalized semantics; every other byte remains significant. Swapped
references are tested against a trusted expected snapshot, not inferred from syntax.
The Python package never imports the TypeScript implementation.

Dispatch uses the existing generic reader plus a fixture-installed closed owner
validator. No production family-specific reader, assurance verifier or retry policy
was added. Standalone codec tests do not load that registration.
