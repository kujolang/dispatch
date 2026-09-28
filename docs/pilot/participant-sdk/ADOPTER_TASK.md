# Limited participant SDK adopter task

This is an experimental local pilot, not a public release or production claim.
Your coordinator must identify whether this is a human adopter or an agent
rehearsal. An agent rehearsal cannot establish human usability.

## Allowed inputs

Only the reviewed SDK archives/dependencies, supplied pins, package README/API,
bundled design/trust docs, generic schema/spec, published conformance corpus and
HOST_INTERFACE.md. Do not inspect Dispatch, Workcell, existing participant source,
private SDK modules, test runners or previous chat history for implementation
hints. Package implementation is installed software, not onboarding documentation.
Keep a list of public files consulted. Record missing information before asking.

## Acquisition

The coordinator supplies the exact SHA-256 of frozen-inputs.json separately.
Verify that manifest first, then every named file. Do not accept a replacement
manifest from a feed as new authority. reviewed-pins.json identifies the unchanged
reviewed SDK/dependency closure. Package name/version alone does not confer trust.

Select TypeScript/Node or Python. Do not fetch substitutes or upgrade dependencies.
The supplied Python wheel closure targets CPython 3.10 on macOS x86_64; stop and
report if your runtime is incompatible. Node requires >=22. For npm, create a fresh
project, copy the supplied package.json/package-lock.json into it, and place the
verified archives in its `download/` directory. Install with `npm ci --offline
--ignore-scripts --no-audit`, an empty cache and public registry fallback disabled.
For Python create a fresh venv and install the supplied requirements.lock with
`--no-index --only-binary=:all: --require-hashes --find-links <verified archives>`.
Do not build from sdist. No source checkout or source-directory import fallback.

## Implementation

Choose a new `pilot.*` owner namespace and closed participant schema with sensible
field names. Do not reuse an existing participant/example namespace. Implement a
small public-API proof: registration, codec, provisional unknown, exact reference,
parse, snapshot match, terminal report and readback finalization. Then implement
the documented host interface. Do not add effect execution, reference lookup,
trusted configuration selection or retry/admission logic.

Run all 45 cases in the supplied conformance corpus without changing expected
results or omitting cases. Write your own runner using the public API. If an
operation or case cannot be derived from public material, log the gap and stop
that part; do not read another implementation.

Keep install commands, runtime versions, imports, time/steps to first valid
handoff, approximate code size and confusing names/errors. These are observations,
not performance targets. Also probe malformed references, extension mismatch,
correlation mismatch, unknown namespace and noncanonical wire. Record bounded
error categories and whether you could diagnose each from docs.

## Questions log

For every question record: public material consulted, missing information,
category (documentation gap / API ergonomics / host integration / out of scope),
question, answer source, and retest. Do not silently work around a genuine gap.
A correction creates a separately hashed addendum; original frozen inputs remain.

## Independent comprehension and misuse responses

In your own words answer:

1. What does the SDK do and not do?
2. Who owns effect execution and who decides replay?
3. What does unknown completion knowledge mean?
4. Does a successful snapshot match authorize execution?
5. Can package/schema metadata choose trusted configuration?

Explain your response to each suggestion: accept Dispatch IDs in caller input;
use correlation as permission; add a participant retry helper; select a Git target;
resolve evidence refs in the SDK; infer commit from exit 0. Grade concepts, not
specific wording. The coordinator must not prewrite your answers.
