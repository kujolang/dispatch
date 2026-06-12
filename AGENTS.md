# Agent Guidance

Read `README.md` first, then this file. For backlog-style tasks, also read the active checklist or release document named in the request.

## Search Hygiene

Exclude generated and bulk paths from broad sweeps unless the task explicitly targets them:

```bash
rg "pattern" -g '!target/**' -g '!outputs/**' -g '!tests/tmp/**' -g '!**/.git/**'
```

For source/example cleanup, keep tests and fixtures in the result set only when you are validating contracts or checking whether an example is canonical. Do not shorten fixtures just because they are verbose; explicit fixture output can be useful.

## Canonical Examples

Prioritize copyable examples over tests: examples should model the most token-efficient idioms we want agents to imitate.

Canonical, user-facing examples live in:

- `README.md`
- `docs/enterprise-deployment.md`
- `docs/release-checklist.md`
- `examples/research-report/`

The files under `examples/research-report/sources/` are local fixture sources used by the verified offline workflow. They are canonical fixture inputs, not generated output.

Historical audit trails live in:

- `docs/dispatch-extension-checklist.md`
- `docs/dispatch-next-session-checklist.md`
- `docs/dispatch-next-session-checklist-v2.md`

Treat those checklist files as completed implementation records unless the user asks to update the backlog itself.

Generated or bulk paths:

- `outputs/`
- `tests/tmp/`
- `target/`
- `.ci/`

## Cleanup Preferences

- Preserve CLI output byte-for-byte unless you are intentionally changing a documented command surface.
- Prefer tiny local helpers such as `print_lines`, `print_kv`, `append_section`, or `append_bullets` when they remove repeated formatting noise.
- Keep the feature being demonstrated visible; helpers should remove scaffolding, not hide behavior.
- Update tests with source changes when output contracts or public docs change.
