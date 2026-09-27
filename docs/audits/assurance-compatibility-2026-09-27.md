# Compatibility specification audit and validation

## Baselines

Fetched clean main, except preserved unrelated Agents SDK untracked maintenance files:

| Repository | HEAD = fetched origin/main |
|---|---|
| Kujo | d3357f8f1998334d36fbfab789343678458d3314 |
| Dispatch | b534e45532a685d43ad7b0b2c9ee9a0e0b4659dc |
| Workcell | b34c26c90a8626c988a4234fd2610dcf11df1634 |
| Ability | f103ac5904c69ad7a1c6dffb262200f986d734d4 |
| Agents SDK | bb2202d8b54f44717b1b1f0157a6774f2027cea1 |
| MCP | 07845898ee9f2662d0e0e364973d77cdaac04762 |

All requested lineage commits passed merge-base ancestry checks. Only Dispatch
implementation/tests/docs and Kujo roadmap/docs are modified. Other repositories
are read-only, apart from existing test-owned ignored fixture output.

## Audit decisions

- `src/core/effect_assurance.kujo` uses exact bytes, closed single-effect alpha1,
  issuer-selected host callbacks and current-action numeric attempt matching.
- `src/core/intervention.kujo::retry_is_effect_safe` intentionally permits unknown
  external-idempotent effects with nonempty enforcement references. Preserve it.
- `src/core/tool_policy.kujo` profiles govern tool allow/deny, not assurance. No
  workflow loader/CLI option expresses an assurance requirement today.
- SQLite, Workcell Git and Ability each prove different predicates. Mechanism
  labels alone cannot select a trusted executable or authenticate an authority.
- Agents SDK Ability projection validates identity/output/receipts; MCP projection
  exposes effect/idempotency hints and application receipts. Neither is a Wave C
  trust resolver or capability advertisement authority.
- Ability dual commits and live session/owner checks remain distinct from SQLite
  atomic commit and Git marker/ref CAS. No adapter code changes are needed.

The canonical normative rules are `docs/effect-assurance-compatibility.md`.
Historical reports remain evidence. A separate reference evaluator proves exact
profile selection and explicit legacy/optional/required outcomes; it is not wired
into workflow defaults. A static bounded capability catalog is advisory only.
A common conformance helper executes inside all three existing real verifier
fixtures, supplementing rather than replacing their process/crash/privacy suites.

## Security review

Reviewed downgrade, envelope/profile confusion, digest algorithms, issuer authority,
revocation, unavailable evidence, historical bytes, configuration changes, cross-profile
and cross-tenant binding, delayed admission and capability spoofing.

Resolved rules: recognized failures never use optional fallback; required cannot
configure fallback; known profile lacking a verifier is configuration error; revoked
binding takes precedence over missing data; producer mechanism mismatch cannot
pretend to be unsupported host selection; known-envelope extra fields are rejected;
exact authoritative result digest is checked before nonlegacy fallback. Legacy is
explicit and never relabels producer strings as independently verified evidence.

Remaining implementation boundary: persistent mode/profile/configuration revision
selection, mixed-version worker scheduling, restart/rollback enforcement and audit
integration are not yet deployed. The specification requires them before beta and
before production required-policy adoption. The stateless evaluator is not a cached
permission token. Remote authority and multi-effect admission remain unsupported.
