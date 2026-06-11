# Security Policy — Kujo Eval

## Security Model

Evalexecutes user-provided shell commands and reads arbitrary files as part of its evaluation checks. The following protections are in place:

### Command Allowlisting

`is_command_safe()` in `src/checks.kujo` blocks commands containing dangerous patterns:
- `rm -rf`, `sudo`, `chmod`, `curl | sh`, `wget | sh`
- `/dev/` paths, `mkfs`, `dd if=`, fork bombs
- `shutdown`, `reboot`

Commands can also be restricted to an allowlist via the `allowed_commands` config field.

Additional command policy controls:
- `allowed_command_patterns`: allow only commands matching approved substrings
- `blocked_arg_patterns`: deny commands containing blocked argument substrings even if base command is allowed
- `command_pattern_match_mode`: choose `substring` (default) or `token` matching for allow/deny patterns
- `policy_profile`: bootstrap secure defaults quickly (`strict-ci`, `local-dev`, `release-gate`)

### Path Boundary Enforcement

`is_path_safe()` in `src/checks.kujo` restricts file access:
- Blocks `..` path traversal
- Blocks access to system directories (`/etc/`, `/root/`, `/var/`, `/tmp/`)
- Normalizes candidate and allowlisted paths before policy checks (handles `./`, repeated `/`, trailing slashes)
- Supports optional `allowed_paths` config for directory allowlisting

Path policy controls:
- `path_policy_mode`: top-level path mode (`open` or `allowlist-required`)
- `policy_stage_overlays.<stage>.path_policy_mode`: stage-specific path mode overrides
- `allowed_paths`: explicit path allowlist for file-backed checks when `path_policy_mode` is `allowlist-required`

## Enterprise Deployment Patterns

Evalis intended for controlled execution environments. For enterprise rollout, use defense-in-depth around the runtime:

1. **Isolated execution**: run suites in ephemeral containers or isolated CI workers.
2. **Least privilege**: mount only required directories and avoid privileged runner accounts.
3. **Policy-first suites**: set suite-level `allowed_commands`, `allowed_command_patterns`, `blocked_arg_patterns`, `allowed_paths`, and `allowed_env_vars`; only override per-test when necessary.
4. **Stage path hardening**: use `policy_stage_overlays` with `path_policy_mode: "allowlist-required"` so CI and release stages apply stricter path boundaries than local runs.
5. **Deterministic artifacts**: write reports to unique per-run output directories and publish only required formats.
6. **Supervised process control**: use external job timeouts/watchdogs to enforce hard preemption where required.

### Example High-Control Policy Baseline

```json
{
	"allowed_commands": ["kujo", "echo", "cat"],
	"allowed_command_patterns": ["kujo run", "kujo test", "echo "],
	"blocked_arg_patterns": ["--privileged", "rm -rf", "curl |", "wget |"],
	"allowed_paths": ["./eval_results", "./snapshots", "./fixtures"],
	"allowed_env_vars": ["CI", "GITHUB_SHA", "GITHUB_REF"]
}
```

### Environment Variable Allowlisting

`env_var_equals` supports optional allowlisting via `allowed_env_vars`.
- Suite-level `allowed_env_vars` in `eval.json` is threaded into env checks by default
- Test-level `params.allowed_env_vars` overrides the suite-level allowlist for that check
- Any `env_var_equals` check targeting a variable outside the effective allowlist fails closed

### Output Redaction

`redact_sensitive()` in `src/checks.kujo` scrubs sensitive patterns from stdout/stderr:
- API key patterns (`sk-` prefix)
- Bearer tokens
- Password and secret parameters (`password=`, `secret=`)

Optional audit telemetry:
- `redaction_audit_mode: true` includes `redaction_hits` and `redaction_patterns` in command-check `details`
- Useful for policy audits without exposing raw secret material
- `redact_output_patterns` supports organization-specific additions (for example internal token prefixes) on top of built-in redaction rules

### Config Abuse Protection

- `MAX_CONFIG_SIZE_BYTES`: 1MB file size limit before parsing
- `MAX_TESTS`: 1000 test maximum per suite
- `MAX_STRING_LENGTH`: 10K character limit on test names

## Known Limitations

- `execute_status` runs commands via the system shell — commands have access to the user's environment
- Path validation blocks common attack vectors but is not a sandbox
- `http_get` may panic in interpreter mode (Kujo runtime quirk)
- Timeout behavior depends on runtime support for `execute_status` options; validate timeout enforcement in your target Kujo build.
- Output redaction uses simple pattern matching, not cryptographic guarantees
- Interpreter KUJORUN001 warnings may appear even when command exit codes are successful

## Reporting a Vulnerability

To report a security issue, please open an issue on the GitHub repository with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

## Responsible Disclosure

Please allow reasonable time for fixes before public disclosure. Security issues in the check implementations themselves (not the Kujo runtime) will be addressed as priority.
