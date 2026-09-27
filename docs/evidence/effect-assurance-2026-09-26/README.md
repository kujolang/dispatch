# Wave C local assurance proof

These are historical, expired fixture artifacts, not replay authorization tokens.
`proof.json` records eight real paths across SQLite and Git: precommit process
loss, commit-before-reply process loss, expired assurance and uncertain
non-idempotent effects. Four successful replay paths each include 45 input and
semantic binding cases. `artifacts.json` hashes the original result and assurance
bytes. The `.sha256` files bind assurance transport bytes; live sink verification
is still required and cannot be replaced by these stored files.

Reproduce from Dispatch using the immutable runtime described in the audit and
Workcell b34c26c90a8626c988a4234fd2610dcf11df1634:

```bash
KUJO_BIN=/path/to/source/kujo WORKCELL_ROOT=../workcell \
  node tests/effect_assurance_integration.mjs
```

The retained logical effect is one row (SQLite) or one intent marker plus target
ref (Git), including after retry. The original execution result remains unknown;
the separate observation establishes not_started or committed at resolution.
The harness also tests actual sink refusal for changed input and a moved Git ref,
expired mutation admission, confined assurance loading, same-step continuation,
unchanged state on denial, and private workload content absent from diagnostics.

Exact runtime binary SHA-256:
`4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93`.
Runtime source: Kujo 5d72aab (unchanged runtime code at 39d5a0a).
Host: Intel macOS. Node v26.7.0, Git 2.42.0, sqlite3 CLI 3.51.0.
No container or live provider is needed. The SQLite library used for effects is
Kujo's locked Rust dependency; the sqlite3 CLI independently checks row counts.

`verified-logs.json` retains local full-gate/regression log digests. These logs are
local evidence references; no release or hosted-CI success is inferred. The Docker
availability receipt records the absent local daemon and a safe resume command.

The source/trust map, security review, gate outcomes, compatibility and limitations
are in [the audit](../../audits/effect-assurance-prototype.md) and
[the contract documentation](../../effect-assurance.md).
