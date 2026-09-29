# Bounded one-effect admission audit

The implementation and focused evidence are at Dispatch source commit
`0176882e049e7970ca4b2982205101801320ac22`. Kujo's companion documentation is at
`ce1307482776893b563f67b867889b9a6dc617a4`; no runtime source changed.

Starting current-main pins were Dispatch
`8fbc5fa930ff5d1ffdc833bc07f9766192711b36` and Kujo
`dbb474161f43aa0273cf0dce850ae69a836fe4db` (fast-forwarded from the previous session's
`252b2b88c3c4c182222dcdb5223b86f9527133ad` before implementation). Related repositories
were not modified; the Agents SDK's unrelated untracked maintenance files remain
untouched.

The [admission contract](../contracts/effect-set/one-effect-admission.md) owns the
production model, authority table, crash matrix and TOCTOU analysis. The
[validation receipt](../evidence/effect-continuation/validation.json) owns exact
commands, counts, source/toolchain pins, omissions, warnings and transcript hashes.

The focused proof covers 39 named scenarios, including all five real SIGKILL
boundaries, a synchronized start of two independent controllers against the same
persisted selection, actual SQLite state plus a mutation-attempt audit trigger,
expiry after selection and after admission, changed authority/registration/plan,
state and journal mismatch, orphan claims, retained-evidence loss, SQLite-backed
authority over an invalid JSON mirror, and the actual previous source reader's
refusal. The synchronization barrier only releases the controllers to compete;
mutation exclusion uses Dispatch's existing advisory run lock and durable claim.

The exact claim is bounded: one selected not-started SQLite effect can be attempted
after a live verified prefix, using current persisted authority. Completed effects
are never passed to execution, unknown prefix blocks selection, admission does not
prove mutation, and lost acknowledgement does not permit replay. Independent
inspection can establish completion. The parent remains paused and unchanged.
Later effects require a separate future policy, not a remainder ticket.

The final full canonical gate runs against the committed source above. No source
or test refinements are made during that gate. Evidence/documentation publication
commits add no execution behavior. Historical vectors are unchanged; the only new
vector file is `tests/vectors/effect-selection.json`, with four independently
encoded Kujo/TypeScript/Python/Go records. Baseline focused suites ran before
implementation; final conformance has 119 checks, five MCP responses and nine
malformed/initialization cases.

Development failures were corrected rather than suppressed: the initial fixture
used a global `raw` binding also assigned by its artifact helper, so the purported
parent bytes were an observation; the helper now uses a distinct binding. The
parent-attempt comparison now uses the same default-attempt convention as the
existing runner. Temporary diagnostic output was removed; the final focused and
canonical fixtures require clean stderr and assert every rejection.

This does not prove remote trust, hostile-host verification, multi-host control,
generalized scheduling, compensation, cross-sink atomicity, stable SDKs, A2A,
machine recovery, exactly-once or universal rollback. An expired immutable
selection fails closed; explicit rebinding of renewed evidence for an unconsumed
attempt is the next smallest proof. Consumed claims must never be reclaimed by
that future operation.

## Final validation result

The complete canonical gate passed **74 suite groups**, including all **101 tests
across 24 workflow shards**, command-surface smoke and **3/3 release workloads**.
The suite transcripts contain **210/210 named Kujo unit tests** in total; custom
integration assertions are reported separately. No suite failed or was skipped.
The new continuation suite passed all **39 scenarios** both independently and
inside the full gate. Kujo formatting, **7/7** affected docs/example tests and the
locked release build passed. Existing tiny_http and npm configuration warnings
are retained without suppression. All **84 retained evidence artifacts** have
verified SHA-256 digests in the receipt.
