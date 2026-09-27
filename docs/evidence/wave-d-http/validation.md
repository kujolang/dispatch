# Local verification — 2026-09-27

Runtime source `5d72aab4b99e7f8c01e4c208d6c97061934c7447`, optimized binary
SHA256 `4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93`.
Node26.7.0. No hosted CI claim.

- Ability: `KUJO_BIN=… bash scripts/verify-release.sh` PASS, including existing
  contract/runtime/cross-language/registry/devkit/Fence checks and new bounded
  HTTP/OpenAPI contract checks. Business gateway and beta profile source unchanged.
- Kujo documentation: `cargo fmt --check` and `cargo test --test readme_contracts`
  PASS (one contract test). Runtime unchanged; existing warnings not suppressed.
- Source syntax: Kujo check for fixture/reader, Node checks and shell syntax PASS.
- `git diff --check` PASS.

The three JSON records are copied from actual full-gate HTTP fixture invocations;
only the temporary local root path is removed. Initial effects: response-loss1,
pre-commit timeout0, explicit application error0. Final counts: business1/receipt1
in all three. Every attempt runs21 invalid network requests before admission, then
two concurrent valid deliveries (one admitted, one denied). Each scenario runs24
handoff/integrity negatives plus actual locked denial, stale-checkpoint rejection,
expired/stale/reused tickets, process replacement and standalone receipt replay.

Hashes/revisions are observed run-specific commitments, not regenerated golden
constants. Server/client/controller exits are real; no in-memory authority survives.

Additional fresh review: published identifier schemas reject terminal newlines,
matching existing parser behavior. Ability full release gate rerun PASS after this
clarification (retained ability-gate.log is the final run). Focused application-error
rehearsal rerun PASS after asserting failed execution + receipt-finalization failure
+ independent not_started readback; retained application-error-focused.log.

Dispatch full gate: `KUJO_BIN=… DISPATCH_OFFLINE_FIXTURE=true bash scripts/run_release_gate.sh`
PASS. Retained dispatch-gate.log includes all three HTTP scenarios, SDK and both MCP
regressions, all three real Wave C profiles, persisted negotiation, beta migration,
legacy failure/review/reexecution,24 general contract shards, VM/interpreter command
smoke and3/3 bounded release workload runs. No failing checks were suppressed.
CI pins Ability d6c970785f8d8bea04de0dce37920c2d0ca1c067 for future hosted runs;
local execution is the evidence recorded here.
