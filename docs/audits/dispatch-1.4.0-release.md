# Dispatch 1.4.0 release execution receipt

Published 2026-10-14 under explicit maintainer authorization. This receipt is a
post-publication documentation update; it does not change the immutable tag or archives.

## Source and distribution

- [PR 7](https://github.com/kujolang/dispatch/pull/7), candidate `50f835fa0cc3069b545ef1b0c1200bf73a30965d`.
- Tag `v1.4.0`: `83541c46b2c1fd5dcc812a07591e1879370dce8b`; merge tree verified identical to the accepted candidate.
- [GitHub release](https://github.com/kujolang/dispatch/releases/tag/v1.4.0), ID `413181077`.
- GitHub source archive SHA-256: `5860963458806627cbe5e04f3e9633554efbf013a162fe18467722e75129ee12`.
- [Kennel exact manifest](https://kennel.kujolang.ai/api/v1/packages/dispatch/1.4.0.json); latest resolves to `1.4.0`.
- Kennel normalized archive SHA-256: `d381453ce0f4d8bc6f4dafdc6aba35e1ad593092a5f3a3e6cf2522fe41989c9e`.

These are separate distribution archives. Downloaded bytes matched their own
checksums/provenance, release ID and exact source. The GitHub archive also contained
the expected CLI entry, 1.4.0 manifest, Kujo 1.8.1 minimum and unchanged AI SDK pin.

## Acceptance

- [Candidate CI](https://github.com/kujolang/dispatch/actions/runs/38618066009): full Dispatch gates and pinned AI SDK/Agents SDK checks on Linux/macOS; actual 1.2 and 1.3 release upgrade, restart and backup rollback; state-scale and clean source-install acceptance.
- [Tagged workflow](https://github.com/kujolang/dispatch/actions/runs/38629054322): both exact-tag gates, package/checksum/provenance attestation, and Linux/macOS clean installation passed.
- [Registry publisher](https://github.com/kujolang/kennel-registry/actions/runs/38637557845): scoped release reconciliation and live production verification passed.
- Independent macOS public-consumer acceptance used the published Kujo 1.8.1 npm artifact and published Kennel 1.1.1 client: fresh and cached installation, provenance lock, exact AI SDK Git dependency, and filesystem/SQLite pause followed by fresh-process resume and inspection passed.
- Pinned SDK local checks passed: AI SDK quality gate 150 tests; Agents SDK 41 offline checks. The redundant local full Dispatch run was intentionally stopped after both complete hosted gates passed; it is not counted as a complete local pass.

## Compatibility and limits

Kujo minimum is 1.8.1 to align with released Eval 1.1.0. AI SDK remains exactly
`5184a122590dd5698770b50d99b69ed11c7ec84a`. Installer and validation manifests
separate base dependencies from optional integration sources. Eval 1.1.0, MCP 1.3.2,
Agents SDK 1.1.2 and exact Workcell effect/graph paths were verified; no companion
repository needed a new release in this task. Tagged verification now provisions
the operator dependencies explicitly.

Stable upgrade proofs use paused research-report workflows on filesystem and SQLite.
Experimental graph/operator authorities retain exact source/dependency requirements;
their crash/restart/recovery checks do not claim automatic cross-version migration.
Offline and localhost checks do not certify remote providers or arbitrary hosted
infrastructure. Participant SDKs remain unpublished and experimental boundaries remain.
