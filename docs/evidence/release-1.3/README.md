# Dispatch 1.3 release evidence

The repository-wide Codex Security review registered source `4a6bbdc` and found
three review-continuation defects. Its sealed report preserves that baseline.
`security-remediation.json` links the fixes and regressions rather than rewriting
the original report as clean. The dedicated regression covers v1/v2 direct and
model tool denials, configured and environment policies, allowed controls,
invalid-policy nonmutation, a second approval gate, four concurrent deliveries,
and unsigned callback rejection. Final release validation and public artifact
receipts are recorded separately when complete.

`tests/local_proxy_integration.mjs` exercises a real HTTP POST through the normal
SDK subprocess and allowlisted custom-provider bridge against a localhost fixture
(`local-release-probe`). It explicitly enables the trusted-host Kujo private-network
override and both SDK/Dispatch localhost opt-ins. Without the runtime override,
the same request was denied before reaching the socket. This proves the configured
HTTP route, not external provider certification; default private-network denial
is unchanged.
