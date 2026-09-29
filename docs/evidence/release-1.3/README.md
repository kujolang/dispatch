# Dispatch 1.3 release evidence

The repository-wide Codex Security review registered source `4a6bbdc` and found
three review-continuation defects. Its sealed report preserves that baseline.
`security-remediation.json` links the fixes and regressions rather than rewriting
the original report as clean. The dedicated regression covers v1/v2 direct and
model tool denials, configured and environment policies, allowed controls,
invalid-policy nonmutation, a second approval gate, four concurrent deliveries,
and unsigned callback rejection. Final release validation and public artifact
receipts are recorded separately when complete.

A real HTTP POST through the allowlisted custom-provider bridge was exercised
against a localhost fixture (`local-release-probe`). It required both Dispatch
and AI SDK localhost opt-ins. This proves that bridge's configured HTTP route,
not external provider certification or permission to weaken the normal SDK
adapter's private-network policy.
