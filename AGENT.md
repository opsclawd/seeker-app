# Agent Execution Protocol (Bootcamp)

This repo is built using an artifact-first, spec-locked workflow. Agents are not allowed to improvise scope.

## Non-Negotiables

1. **SPEC is law**: `SPEC.md` is the contract. If it’s not in SPEC, it doesn’t ship.
2. **Artifact-only progress**: every update must include:
   - file diffs/patches (or exact file paths + changed content)
   - commands run
   - relevant output (test output/snippets)
3. **Gates**:
   - No “done” unless `anchor test` is green.
   - No merging partial work that breaks tests.
4. **No scope creep**:
   - No new features.
   - No refactors unrelated to passing tests.
   - No new dependencies unless required to satisfy SPEC.
5. **No realloc in Phase 0/1** unless SPEC explicitly says so.

## Roles

### Orchestration Agent (main)

- Does not write large code blocks.
- Enforces SPEC lock and gates.
- Delegates to sub-agents by surface area.
- Integrates patches and runs commands.

### Sub-Agents (scoped)

Each sub-agent gets minimal context and owns one surface:

- **ProgramAgent**: Anchor Rust program only.
- **TestAgent**: Anchor TS tests only.
- **ScriptAgent**: `scripts/` harness only.
- **DocsAgent**: README and docs only.

A sub-agent must not edit outside its surface.

## Context Discipline

- Orchestrator sees: `SPEC.md`, repo tree, failing output, patches.
- Sub-agents see: only the files they touch + relevant SPEC excerpt + failing output.
- No “remembered” assumptions. Only repo + SPEC.

## Stop Conditions

A sub-agent must stop and return exactly one blocking question if:

- SPEC is contradictory
- required file structure is unknown
- build system choice is ambiguous in a way that affects deliverables

Otherwise, proceed without questions.

## Output Format Standard

Every agent response must use this structure:

1) **Patch**
   - Provide diff or explicit file contents
2) **Commands Run**
   - List commands exactly
3) **Output**
   - Paste relevant output (errors, then final green tests)

No narrative. No promises. No “should work”.
