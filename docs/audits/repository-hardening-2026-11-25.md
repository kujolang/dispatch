# Repository hardening on November 25, 2026

The baseline was `18b5c73`. The review covered the run catalog, state projection and recovery, shared mutation logs, webhook and process isolation, bundles, operational limits, and release verification. Generated output, temporary tests, and historical evidence were excluded from broad source searches.

- Concurrent runs previously read and atomically replaced the same mutation log without coordinating the read. Six local writers attempted 150 records and only 32 remained. The shared lock now covers read, rotation, and publication. All 150 unique records survived under the same workload. Rotation also counts UTF-8 bytes and preserves the existing JSONL framing.
- A malformed indexed row could abort the CLI instead of triggering its existing recovery scan. The reader skips invalid indexed row shapes and run names. A new contract verifies that the authoritative state is listed, the index is rebuilt, and the following listing uses that index.
- The catalog now sorts distinct timestamps once and preserves input order for equal timestamps. Before and after timings use the public indexed catalog, the same on-disk fixtures, and the same local Kujo 1.10.0 executable. The sorted run ID digests matched for both sizes.

| Indexed runs | Baseline elapsed | Candidate elapsed |
| --- | ---: | ---: |
| 240 | 3,210 ms | 205 ms |
| 960 | 51,088 ms | 713 ms |

```bash
node docs/audits/evidence/catalog-fixtures-2026-11-25.mjs tests/tmp/catalog-hardening-bench
kujo run docs/audits/evidence/catalog-order-2026-11-25.kujo -- tests/tmp/catalog-hardening-bench/240 tests/tmp/catalog-hardening-bench/960
```

The focused hardening contracts passed on checksum-verified Kujo 1.8.1 and local Kujo 1.10.0. Both runtimes produced the same catalog order digests, and the local 1.10.0 checks covered run locking, crash replay, external idempotency, SQLite state, and webhook concurrency. The 1.8.1 release gate also passed its startup, bridge, first workflow, and concurrent audit smoke checks.
