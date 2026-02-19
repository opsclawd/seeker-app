# Single-Prompt Benchmark — Phase 0

Copy/paste the block below into your agent runner (Codex/OpenClaw/etc.). Do not edit it during the run.

---

You are the Orchestration Agent.

Before doing anything:

1) Open and read AGENT.md and follow it exactly.
2) Open and read SPEC.md. If missing or mismatched, create/update SPEC.md to match the PHASE 0 CONTRACT below.

Ship Phase 0 in THIS repo as a complete, reproducible deliverable:

Deliverables:

- Anchor workspace compiles
- Anchor program: one instruction + one PDA-backed account + one event
- Anchor TypeScript tests (deterministic localnet)
- Minimal TypeScript script harness (`scripts/hello.ts`)
- README updated with exact commands

Hard rules:

1) You delegate to sub-agents (ProgramAgent, TestAgent, ScriptAgent, DocsAgent). Keep context minimal.
2) You must create or update `SPEC.md` to exactly match the contract below, then obey it.
3) No scope creep. Only what is specified.
4) Output must be artifact-based: patches + commands run + output. No narrative updates.

PHASE 0 CONTRACT (must be written into SPEC.md verbatim in meaning):

Program:

- PDA: seeds = ["hello", authority_pubkey]
- Account: HelloState { authority: Pubkey, message: String (max 64 bytes), updated_at: i64 }
- Event: HelloEvent { authority, message, updated_at }
- Instruction: hello_write(message: String)
  - authority signer required
  - derives PDA from seeds; creates if missing, updates otherwise
  - rejects message > 64 bytes
  - updated_at = Clock unix_timestamp
  - emits HelloEvent

Errors:

- Unauthorized
- MessageTooLong
- InvalidHelloPda (optional if constraints cover it)

Tests (must exist and pass):

- hello_write initializes and stores message
- hello_write updates message on second call
- wrong signer cannot write to someone else’s PDA (must validate PDA seeds/authority)
- message too long fails

Scripts:

- scripts/hello.ts calls hello_write against localnet and prints tx + reads state back

Docs:

- README “Phase 0” section includes exact commands to:
  - install deps
  - run anchor test
  - run script

Execution protocol:

A) Repo is a split layout:
   - Anchor workspace (program + tests) lives in `./anchor/`
   - Script harness lives at repo root in `./scripts/`

   Ensure you run Anchor commands from `./anchor` (e.g. `cd anchor && anchor test`).
   Do NOT initialize a second Anchor workspace.

B) Spawn sub-agents:

- ProgramAgent: implement program per SPEC
- TestAgent: implement tests per SPEC
- ScriptAgent: implement scripts/hello.ts
- DocsAgent: update README commands

C) Run `anchor test` until green.

D) Final output must include:

- patches for all changed files
- commands run
- final `anchor test` output
- AGENT.md artifact-only output
- delegation to sub-agents by surface
- anchor test gate (green)
- no scope creep beyond SPEC

Now execute.

---
