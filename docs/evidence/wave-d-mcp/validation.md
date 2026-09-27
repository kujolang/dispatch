# Local validation — 2026-09-27

Runtime: optimized Kujo source `5d72aab4b99e7f8c01e4c208d6c97061934c7447`,
SHA-256 `4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93`.
Node v26.7.0. No hosted CI claim. No runtime source changes.

- MCP: `KUJO_BIN=… bash tests/run_all_tests.sh` PASS; retained `mcp-gate.log`.
  Includes new controlled input/framing/privacy tests, existing standalone bridge,
  projection/gateway contracts, host tooling, package reproducibility and matrix.
- MCP: `node scripts/certify-ability-hosts.mjs` and generated matrix PASS. Real
  checks refreshed evidence for immutable MCP code `f226601`. Initial absent
  Ability Gateway dependencies were reproduced in isolation and installed from
  its existing lockfile. No tests were skipped/suppressed to pass.
- Ability: `KUJO_BIN=… bash scripts/verify-release.sh` PASS, retained
  `ability-gate.log`; source unchanged.
- Kujo docs: `cargo fmt --check`, `cargo test --test readme_contracts` PASS
  (one contract test). Existing vendor/compiler warnings were not suppressed.
- Node syntax checks, shell syntax and `git diff --check` PASS.

The two JSON proofs are copied from actual release-gate invocations, with only the
local temporary root path omitted. Each records 21 negative correlations, seven
MCP processes, locked denial, expired/stale/duplicate admission, standalone replay,
persisted beta required/deny and final one-business/one-receipt counts. Runtime
result/configuration hashes vary across runs because run/session IDs and time vary;
those are retained as observed, not regenerated golden values.

- Dispatch: `KUJO_BIN=… DISPATCH_OFFLINE_FIXTURE=true bash scripts/run_release_gate.sh`
  PASS, retained `dispatch-gate.log`: both MCP scenarios, SDK Wave D regression,
  persisted negotiation/all three real profiles, beta migration, common assurance,
  Ability crash/expiry/revocation, legacy failure/review/reexecution, all24 contract
  shards, VM/interpreter command smoke and3/3 release workload runs.
- CI now pins MCP participant code `f226601be08a48e7b9083f0cd3c6b42c1e43aac2`.
  This is configuration for future CI, not evidence that hosted CI ran.
