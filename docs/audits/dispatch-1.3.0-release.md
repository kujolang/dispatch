# Dispatch 1.3.0 release receipt

Published September 29, 2026, as an official non-draft release for the tested
Linux/macOS controller scope. The immutable `v1.3.0` tag resolves to
`7558d0b2157449a484646d9a4b0d069a70c36f85`. This evidence update is later than
the released source and does not replace its bytes.

## Public artifacts

[GitHub release](https://github.com/kujolang/dispatch/releases/tag/v1.3.0), ID
`399282309`, supplies the source archive, checksum and provenance:

- `dispatch-v1.3.0.tar.gz`: SHA-256 `11f2337a96f894d289c03c796ac814f4149b5b0fb3f7f102af391ed6c23adc03`.
- Kennel `dispatch@1.3.0`: SHA-256 `e329d5a2d23c4d9026ae89a2f50469052c00061b5d2a89911de5faa784d59e79`.

Both downloaded archives match all 885 tracked source files byte for byte.
GitHub attestation metadata binds the GitHub archive to this source and release
workflow. Kennel's provenance identifies the same source/tag/release. Distinct
archive encodings have distinct hashes; file equality is checked separately.

The installer closure uses Kujo 1.6.0, AI SDK 1.1.1 and Agents SDK 1.1.2.
Workcell, Ability and MCP 1.2.0 form the tested optional adapter cohort. Exact
revisions remain in `release/dispatch-v1.3.0*.refs`.

## Final validation

- [Exact candidate Linux/macOS pipeline](https://github.com/kujolang/dispatch/actions/runs/36585296407): complete release gate, companion offline gates, v1.2 upgrade/backup rollback, scale checks and installed source closure passed.
- [Tagged publication pipeline](https://github.com/kujolang/dispatch/actions/runs/36589227758): both full gates, artifact/provenance publication and both clean tagged-install smoke tests passed.
- [Fresh public Kennel installation](https://github.com/kujolang/kujo/actions/runs/36591579051): all four companion packages passed. Dispatch version, validation, 10 SDK adapter tests, 20 failure-safety tests and filesystem/SQLite workflows passed without source-checkout imports. The first harness used unsupported backend name `json`; it was corrected to documented `filesystem`, with no release-byte changes.
- Local final gate: 76 named suites, including 210 registered Kujo assertions across 35 suites (101 workflow assertions in 24 shards), and three bounded release workloads passed. Other suites contain their own integration/vector assertions.
- Private SDK package/distribution checks: TypeScript and Python 45/45 with exact parity; 15 substitution cases and offline operation passed. Automated adopter pre/post-CAS SIGKILL and fresh-controller replay preserved one logical effect; contention admitted one and denied three; 12 input-denial probes passed.
- Concurrent selected-effect work was included with user authorization, 39 focused scenarios, independent diff review and the final combined gates.
- ShipCheck: 16/16, no warnings. Candidate security review resolved three review-callback findings: configured tool policy, step-scoped approval, and atomic legacy decision claim. The sealed candidate and combined-diff reviews reported no new findings; this is scoped review, not exhaustive security certification.

An earlier pre-release Ubuntu HTTP timeout fixture initialization failure was
not reproduced after adding redacted nested test diagnostics. Its cause remains
unconfirmed; subsequent full candidate and tagged gates passed. Assertions and
effect retry policy were not weakened.

## Scope

Wave C beta remains experimental and opt-in in its required/deny single-effect
domain, with alpha retained. Wave D alpha remains a trusted-local-host
correlation contract. The separate experimental local operator API may admit one
explicitly selected not-started SQLite effect; it cannot replay the parent or
execute remaining effects automatically. Participant SDKs remain unpublished.
No remote-provider certification, remote participant trust, exactly-once,
universal rollback, general machine-loss recovery, Windows certification or
human-usability validation is claimed.

[Cross-repository receipt and public-site verification](https://github.com/kujolang/kujo/blob/main/docs/evidence/kujo-1.6-companion-candidates/dispatch/receipt.json)
retain the exact dependency set, archive and provenance hashes, public install
lockfile and website/docs/catalog receipts. No further publication authorization
is pending for this release.
