# Solana App Builder Bootcamp — Phase 0 Spec

## Objective

Bootstrap a deterministic Solana/Anchor workspace that can reliably run:

- A minimal program instruction that writes state to a PDA-backed account
- Anchor TypeScript tests
- A standalone TypeScript script harness
- Reproducible localnet workflow documented in README

Phase 0 is the bootloader for every later phase. No product features. No extra primitives.

## Non-goals

- No frontend UI
- No realloc
- No token/CPI work
- No indexing/event consumers
- No devnet deploy in Phase 0

## Program Contract

### Program Name

- Use the existing workspace program name if already created.
- Otherwise choose a short, stable name and never change it after Phase 0.

### PDA Derivation

Canonical PDA for HelloState:

- seeds = `["hello", authority_pubkey]`
- authority_pubkey = `authority.key().as_ref()`

The program must derive/validate this PDA and must not accept arbitrary state accounts.

### State: HelloState

Stored at the PDA above.

Fields:

- `authority: Pubkey`
- `message: String` (max 64 bytes; reject > 64)
- `updated_at: i64` (unix timestamp)

Space allocation:

- Fixed account size large enough to store max 64-byte string.
- No realloc in Phase 0.

### Event: HelloEvent

Emit on every successful write.

Fields:

- `authority: Pubkey`
- `message: String`
- `updated_at: i64`

### Instruction: hello_write(message: String)

Behavior:

- Requires `authority` signer.
- Derives PDA from canonical seeds.
- Creates PDA account if missing; otherwise updates it.
- Validates:
  - `message.len() <= 64` (bytes)
  - `hello_state.authority == authority` on update
  - PDA matches canonical derivation
- Sets:
  - `authority = authority.key()` (on init)
  - `message = message`
  - `updated_at = Clock::get()?.unix_timestamp`
- Emits `HelloEvent` with the same values.

## Errors

Define explicit custom errors:

- `Unauthorized` (wrong signer / authority mismatch)
- `MessageTooLong`
- `InvalidHelloPda` (if needed; otherwise use Anchor constraint errors)

## Tests (Anchor TS) — Must Exist and Pass

1. `hello_write initializes and stores message`
2. `hello_write updates message on second call`
3. `wrong signer cannot write to someone else’s PDA`
4. `message too long fails`

Test requirements:

- Use canonical PDA helper in tests: `findHelloPda(authorityPubkey)`.
- Assert account fields exactly (authority, message, updated_at presence).
- For wrong signer test, attempt to write to PDA derived from a different authority and expect failure.

## Script Harness (TypeScript)

Add `scripts/hello.ts`:

- Connects with Anchor provider wallet
- Derives PDA for provider wallet authority
- Calls `hello_write("gm")` (or similar short message)
- Prints transaction signature and reads back state

## Docs

Update `README.md` with a “Phase 0” section containing exact commands to:

- install deps
- build
- run tests (`anchor test`)
- run script (`ts-node` or `tsx` or `node` via compiled TS—pick one and document)

## Definition of Done

- `anchor test` passes deterministically on localnet
- Script runs successfully against local validator and reads back state
- README documents the workflow end-to-end
- No extra features beyond this spec
