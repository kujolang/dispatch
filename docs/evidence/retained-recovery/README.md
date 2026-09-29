# Retained-host recovery verification

Tested Dispatch source: `95ddd04cc9a3903a37364393fa0009f4f3a0cf38`.
Tested Kujo documentation: `c8df3878a56030fe0b11c6cfdb9c72ff7ef8ad28`.
Workcell unchanged: `1413e44e287662575322c7052d744b29d4e983bb`.

The focused recovery suite passed 29 scenarios. The complete Dispatch canonical
release gate passed 79 suite groups, including 210 named Kujo tests, command
surface checks and 3/3 bounded release workloads. The affected Kujo format,
seven documentation/repository contract tests and locked release build passed.

`validation.json` records exact commands, starting/tested commits, toolchain and
runtime pins, counts, warnings, skips, scope clarifications and artifact hashes.
`logs/` retains compressed original output, including development failures and
corrections. `retained-samples.json.gz` contains eight representative fresh-process
fixtures, immutable source bytes, consumption claims, reconciliation receipts and
independent sink readback. All compressed/uncompressed hashes and embedded immutable
byte hashes were checked. These samples are audit evidence, not restore authority.

The real Workcell review/checkpoint recovery proof passes. Sequential selection of
Workcell preservation containing `$ref` evidence remains unsupported by the existing
portable commitment grammar; the failed attempted combination is retained in
`logs/focused-3.log.gz`. No historical codec or owner evidence was changed to hide it.
See the [recovery contract](../../contracts/recovery/retained-host.md).

This evidence-only closure commit follows the tested source and changes no runtime,
contract implementation, schema, test or historical participant vector.
