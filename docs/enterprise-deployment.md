# Dispatch Enterprise Deployment Guide

## Scope

This guide describes production assumptions, hardening controls, and operational expectations for enterprise deployments of Dispatch. It is deployment guidance, not proof that any target environment is production-ready. Production or enterprise readiness requires running the release gate, offline fixture proof, live-provider checks where applicable, and platform security validation inside the target environment.

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

## Threat Model and Trust Boundaries

- **Run output root**: treated as trusted local storage. Artifacts are written atomically (temp file + `rename`) so crashes or concurrent readers never observe partial files. Restrict filesystem permissions to the service account.
- **Bundles** (`export-run`/`import-run`): treated as data that may cross trust boundaries. Always sign with `--sign-bundle`; import verifies signatures by default. Never use `--allow-unsigned-bundle` across an environment boundary. Signatures are standard HMAC-SHA256 (`hmac-sha256-v1`) and use constant-time verification; distribute the shared key only through a managed secret store. Rotate keys with `DISPATCH_BUNDLE_SIGNING_KEY_ID` and a `DISPATCH_BUNDLE_SIGNING_KEYS` verification set.
- **Signing key handling**: prefer `DISPATCH_BUNDLE_SIGNING_KEY` over `--signing-key`; CLI flags can leak via process listings and shell history.
- **Webhook sinks/URLs**: `--webhook-sink` is constrained to safe relative paths by default (`DISPATCH_ALLOW_ANY_WEBHOOK_SINK=true` to opt out). Network envelopes require an approved HTTPS origin and HMAC key, are written to a bounded durable outbox before delivery, and reject unsigned replay. A dead-letter does not fail the workflow; monitor and replay it with `dispatch webhooks status|replay`.
- **Sources and config**: `--sources-dir` and `--config` are path-constrained by default; keep `DISPATCH_ALLOW_ANY_*` flags `false` in production.
- **Tool execution**: tools run trusted in-process handler code. Use tool authorization policy (allow/deny, profiles) for least privilege and treat any custom tool/plugin as part of the trusted computing base.

## Concurrency and Durability

- Artifact writes are atomic; the run index (`.dispatch-run-index.json`) is a rebuildable cache, and `runs`/`doctor` fall back to scanning state when it is missing or malformed.
- Dispatch takes an owner-bound per-run lock for run/resume execution and recovers abandoned locks after the configured stale interval. Never share one run directory across hosts without shared lock semantics.
- `DISPATCH_STATE_BACKEND=sqlite` makes a WAL/FULL-synchronous SQLite database authoritative and rejects stale revisions with compare-and-swap. JSON run artifacts remain readable mirrors. Use a database/storage architecture appropriate to the deployment topology; SQLite is not a distributed consensus system.
- Bounded concurrent execution applies only to dependency-ready tool steps explicitly marked `parallel_safe` with an `idempotency_key`. Agent and human-decision transitions remain serialized.
- `doctor` flags runs whose `state.json` exceeds `DISPATCH_STATE_MAX_BYTES`; alert on these to catch runs accumulating oversized step outputs.

## Observability and Monitoring

- Stream lifecycle events with `--webhook-sink <path.jsonl>` or durable `--webhook-url` delivery. Network webhooks require `DISPATCH_ALLOWED_WEBHOOK_ORIGINS` and `DISPATCH_WEBHOOK_SIGNING_KEY`; monitor pending and dead-letter counts and size the bounded outbox retention window.
- Ingest `otel-traces.json` as OTLP JSON, and collect `stream-<step-id>.jsonl` when model streaming is enabled.
- Collect run lifecycle status, failure counts, and approval outcomes from trace artifacts.
- Track mutation operations from `dispatch-mutations.jsonl`.
- Track `policy_deny` audit events from `dispatch-mutations.jsonl` and alert on unexpected deny spikes.
- Alert on repeated `failed`, `interrupted`, and `needs_changes` status patterns.
- Alert on `workflow_budget_exceeded`, open provider circuits, run-lock timeouts, state revision conflicts, and webhook dead letters.
- Monitor run index health (`.dispatch-run-index.json`) and rebuild behavior after corruption.

## Performance and Scale Guidance

- Set `DISPATCH_TRACE_MAX_EVENTS` and `DISPATCH_TRACE_MAX_PAYLOAD_CHARS` based on artifact retention budgets.
- Set workflow `budgets` and `max_parallel_steps` from measured workload limits, not optimistic provider quotas.
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
kujo run dispatch.kujo demo "Development profile smoke" --policy-profile development --yes --non-interactive --decision approve --output-root tests/tmp/profile-dev-outputs
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
kujo run dispatch.kujo runs --output-root tests/tmp/profile-staging-outputs --json --diagnostics
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
kujo run dispatch.kujo doctor --output-root tests/tmp/profile-prod-outputs --strict-mutations --confirm-mutation
```

For a real provider readiness probe, add `--live --workflow-file path/to/workflow.json`. This performs small billable requests against the catalog routes and should run only in an approved environment.

## Operational Playbooks

### Incident triage

1. Inspect run status and artifacts via `inspect` and `runs --json`.
2. Use `doctor` for diagnosis and `doctor --write` only with change-control approval.
3. Capture mutation log entries for incident records.

### Data portability

1. Export with `export-run` from source environment.
2. Import with the managed verification key into the target output root; verification is automatic.
3. Validate imported run metadata and trace/report artifacts.

## Non-Goals

- Dispatch does not replace enterprise IAM, secrets management, SIEM, or policy engines.
- Dispatch does not provide built-in multi-tenant isolation boundaries.
- Dispatch does not guarantee compliance posture by itself; compliance requires surrounding platform controls.
