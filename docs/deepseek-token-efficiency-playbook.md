# DeepSeek Token Efficiency Playbook (Based On This Chat)

Date: 2026-05-24
Source transcript: VS Code chat session 6da55a7b-ab3c-4a95-9c4a-09acb59892e0

## Objective

Reduce token usage while improving output quality and reducing drift.

## Evidence Snapshot

Measured from this transcript:

- Total user messages: 36
- Total user chars: 133,101
- Average user message size: 3,697 chars
- User messages over 5,000 chars: 11
- User messages over 10,000 chars: 3
- Largest user message: 28,118 chars
- Prompt/loop orchestration messages: 10 messages, 96,036 chars total
- Average prompt/loop orchestration message: 9,604 chars

Interpretation:

- Most token usage came from repeating large workflow prompts.
- The biggest optimization is prompt reuse + delta instructions.
- Tool fallback chatter (like rg to grep) happened, but it was a small token contributor compared to repeated long prompts.

## Main Token Drains Found

### 1) Repeated full prompt rewrites

Pattern:
- Asking for "rewrite this prompt" repeatedly and pasting long workflow blocks again.

Impact:
- This was the largest avoidable token sink.

Fix:
- Define one canonical prompt once.
- In later turns, send only deltas (what changed).

### 2) Loop count as prompt payload instead of control signal

Pattern:
- Large repeated instructions for 10/16/22 loops.

Impact:
- Re-serializes the same constraints each turn.

Fix:
- Keep a short command format: "continue N loops under existing contract".

### 3) Output formatting overhead

Pattern:
- Frequent requests for full markdown prompt blocks and long restatements.

Impact:
- Adds output tokens without improving correctness.

Fix:
- Use a strict short response schema for routine updates.

### 4) Multi-role mega prompts for mid-run tasks

Pattern:
- Very long all-in-one policy prompts even for narrow tasks.

Impact:
- High upfront token cost and higher chance of over-compliance verbosity.

Fix:
- Use two modes:
  - Build mode (short)
  - Audit mode (long, only once when needed)

## What Did NOT Matter Much

### rg unavailable fallback

Observed behavior:
- The assistant issued short fallback notes and switched to grep.

Token impact:
- Minor relative to repeated large user prompts.

Action:
- Nice to optimize environment setup, but this is not your main token lever.

## High-Impact Token Strategy

### Strategy A: One-time contract + short delta commands

One-time contract includes:
- Scope
- Constraints
- Validation rules
- Output format

After that, only send:
- "continue 3 loops"
- "switch to audit mode"
- "focus Tier 1 only"
- "return blockers only"

### Strategy B: Enforce compact response schema by default

Default response mode:
- max 8 bullets
- no long prose
- include only changed files + validation results + blockers

Only allow long form when explicitly requested.

### Strategy C: Separate execution from prompt authoring

Avoid asking the model to continuously rewrite prompts.
Instead:
- Keep prompt templates in a repo doc.
- Ask model to reference template ID and run.

### Strategy D: Short loop batches with hard stop checks

Use 2-4 loop batches, not 10-22 by default.
At each checkpoint require:
- pass/fail matrix
- top blocker
- next smallest safe batch

This reduces wasted work when assumptions are wrong.

## Copy/Paste Lean Prompt Set

### 1) Build Mode Bootstrap (use once)

```markdown
You are in BUILD MODE.
Scope: complete actionable unchecked items in docs/<checklist>.md.
Rules: no prompt rewrites, no scope creep, no unrelated edits, concise updates only.
Batch size: 3 loops, then stop.
Update format (max 8 bullets): changed files, commands run, pass/fail, blockers, next 3 tasks.
If any blocker command fails: stop and triage root cause before continuing.
```

### 2) Continue Command (reusable)

```markdown
Continue 3 loops under the existing BUILD MODE contract.
Return only: delta changes, validation table, blockers, next 3 tasks.
```

### 3) Audit Mode Bootstrap (use once)

```markdown
Switch to AUDIT MODE for production-readiness review.
Do not change implementation code.
Validate claims with real commands.
Output only: verdict, score table, blockers, remediation checklist.
Keep narrative concise.
```

### 4) Blocker Triage Command

```markdown
Pause feature work.
Triage this blocker only: <blocker>.
Return: root cause, minimal fix, exact validation command, expected pass signal.
```

### 5) Finalization Command

```markdown
Run final verification matrix and return:
1) command/result table
2) unresolved risks
3) exact release recommendation
No extended recap.
```

## Response Budget Contract (Recommended)

Add this sentence to your prompts:

- "Token budget policy: keep routine updates under 220 words unless I explicitly request expanded detail."

And this structure:

- `Status:` 1 line
- `Changed:` up to 5 bullets
- `Validation:` up to 5 command rows
- `Blockers:` up to 3 bullets
- `Next:` up to 3 bullets

## Practical Workflow For Next Run

1. Start with Build Mode Bootstrap once.
2. Use only Continue Command until a blocker appears.
3. If blocker appears, run Blocker Triage Command.
4. Resume Continue Command in 2-3 loop batches.
5. End with Finalization Command.
6. Only then run Audit Mode Bootstrap if needed.

## Expected Token Savings

Given this transcript profile, applying the above should yield:

- Large reduction in user prompt tokens (biggest gain): high confidence
- Moderate reduction in assistant output tokens via compact schema: high confidence
- Lower drift/rework cost from shorter batches and earlier blocker detection: high confidence

Qualitative estimate for similar sessions:

- 40% to 70% lower prompt-side token usage
- 20% to 40% lower response-side token usage
- Better correctness per token due to less repeated prompt overhead

## Quick Anti-Pattern Checklist

Avoid these during execution:

- Re-pasting long master prompts each turn
- Asking for full prompt rewrites mid-run
- Requesting large narrative summaries every cycle
- Running large loop counts without checkpoint gates
- Declaring completion without command matrix evidence

## Bottom Line

For this chat, token efficiency is mostly a prompt architecture problem, not a tool fallback problem.

Biggest win:
- One-time contract + short delta commands + compact response schema.
