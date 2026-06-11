# Dispatch Enterprise Deployment Guide

## Scope

This guide describes production assumptions, hardening controls, and operational expectations for enterprise deployments of Dispatch.

## Production Assumptions

- Dispatch runs in controlled environments with explicit filesystem boundaries.
- Teams pin Kujo runtime versions for deterministic behavior.
- Workflows, prompts, and tool handlers are versioned and code-reviewed.
- Runtime identities and network controls are managed externally (platform IAM, firewall, service mesh).

## Security Baseline

- Keep `DISPATCH_ALLOW_ANY_OUTPUT_ROOT=false` in production unless there is a documented exception.
- Keep `DISPATCH_ALLOW_ANY_SOURCES_DIR=false` in production unless there is a documented exception.
- Keep `DISPATCH_ALLOW_ANY_CONFIG_PATH=false` in production unless there is a documented exception.
- Keep `DISPATCH_CONFIG_MAX_BYTES` bounded to a policy-approved size (default `262144`).
- Use dedicated per-service output roots with least-privilege filesystem permissions.
- Use tool authorization policy controls (`DISPATCH_ALLOWED_TOOLS`, `DISPATCH_DENIED_TOOLS`, or CLI/config equivalents) for least-privilege execution in sensitive environments.
- Set `DISPATCH_BUNDLE_SIGNING_KEY` from a managed secret store when signed bundle export/import is required.
- Set mutation audit rollover controls (`DISPATCH_MUTATION_AUDIT_MAX_BYTES`, `DISPATCH_MUTATION_AUDIT_MAX_BACKUPS`, and optional `DISPATCH_MUTATION_AUDIT_ROTATE_DAILY=true`) to keep audit growth bounded.
- Enable centralized log collection for `dispatch-mutations.jsonl` and command audit trails.
- Restrict who can execute mutation commands (`doctor --write`, `cleanup --apply`, `import-run`).
- Treat report and trace artifacts as potentially sensitive operational metadata.

## Observability and Monitoring

- Collect run lifecycle status, failure counts, and approval outcomes from trace artifacts.
- Track mutation operations from `dispatch-mutations.jsonl`.
- Track `policy_deny` audit events from `dispatch-mutations.jsonl` and alert on unexpected deny spikes.
- Alert on repeated `failed`, `interrupted`, and `needs_changes` status patterns.
- Monitor run index health (`.dispatch-run-index.json`) and rebuild behavior after corruption.

## Performance and Scale Guidance

- Set `DISPATCH_TRACE_MAX_EVENTS` and `DISPATCH_TRACE_MAX_PAYLOAD_CHARS` based on artifact retention budgets.
- Use isolated output roots per environment (`dev`, `staging`, `prod`) to avoid cross-environment contention.
- Periodically run `cleanup --apply` with explicit status/age policies.
- Keep bundle export/import operations in dedicated maintenance windows for large catalogs.

## Upgrade and Rollout Policy

- Roll out changes first in staging with representative workloads.
- Run full test suite plus smoke commands before promoting to production.
- Use canary rollout when changing workflow templates, retry policy defaults, or tool authorization logic.
- Validate policy behavior for allow/deny tool controls in staging before production rollout.

## Enterprise Quickstart Profiles

The following profiles are copy-paste baselines for common environment tiers.

### Development profile

```bash
export DISPATCH_POLICY_PROFILE=development
export DISPATCH_STRICT_MUTATION_MODE=false
export DISPATCH_ALLOW_ANY_OUTPUT_ROOT=false
export DISPATCH_ALLOW_ANY_SOURCES_DIR=false
```

```bash
kujo run --interpreter dispatch.kujo demo "Development profile smoke" --policy-profile development --yes --non-interactive --decision approve --output-root tests/tmp/profile-dev-outputs
```

### Staging profile

```bash
export DISPATCH_POLICY_PROFILE=staging
export DISPATCH_STRICT_MUTATION_MODE=true
export DISPATCH_MUTATION_CONFIRM=false
export DISPATCH_ALLOW_ANY_OUTPUT_ROOT=false
export DISPATCH_ALLOW_ANY_SOURCES_DIR=false
```

```bash
kujo run --interpreter dispatch.kujo runs --output-root tests/tmp/profile-staging-outputs --json --diagnostics
```

### Production profile

```bash
export DISPATCH_POLICY_PROFILE=production
export DISPATCH_STRICT_MUTATION_MODE=true
export DISPATCH_MUTATION_CONFIRM=true
export DISPATCH_ALLOW_ANY_OUTPUT_ROOT=false
export DISPATCH_ALLOW_ANY_SOURCES_DIR=false
```

```bash
kujo run --interpreter dispatch.kujo doctor --output-root tests/tmp/profile-prod-outputs --strict-mutations --confirm-mutation
```

## Operational Playbooks

### Incident triage

1. Inspect run status and artifacts via `inspect` and `runs --json`.
2. Use `doctor` for diagnosis and `doctor --write` only with change-control approval.
3. Capture mutation log entries for incident records.

### Data portability

1. Export with `export-run` from source environment.
2. Import with `import-run --verify-bundle-signature` into target environment output root.
3. Validate imported run metadata and trace/report artifacts.

## Non-Goals

- Dispatch does not replace enterprise IAM, secrets management, SIEM, or policy engines.
- Dispatch does not provide built-in multi-tenant isolation boundaries.
- Dispatch does not guarantee compliance posture by itself; compliance requires surrounding platform controls.
