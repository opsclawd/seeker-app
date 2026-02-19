# seeker-app

Solana App Builder repo (pinned toolchain). This repo is intended to evolve module-by-module (no throwaway demos).

## Pinned versions (do not float)

- Agave/Solana tooling: **v2.3.0**
- Anchor CLI + crates + TS client: **v0.32.1**
- Host Rust toolchain: **1.93.1**
- Node runtime: **22.22.0 LTS**
- Package manager: **pnpm 10.29.3**

## Prereqs

### Rust (host)
This repo pins Rust via `rust-toolchain.toml`.

```bash
rustup toolchain install 1.93.1
rustup component add rustfmt clippy --toolchain 1.93.1
```

### Node + pnpm
Node is pinned via `.nvmrc`.

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.29.3 --activate
pnpm -v
```

### Solana/Agave CLI v2.3.0
Pick one installation strategy and stick to it across the team.

**Option A: `solana-install` (recommended)**

```bash
sh -c "$(curl -sSfL https://release.solana.com/v2.3.0/install)"
solana --version
```

**Option B: existing system package manager**
Ensure it installs **exactly** `2.3.0`.

### Anchor v0.32.1
Use AVM (Anchor Version Manager) to pin Anchor.

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.32.1
avm use 0.32.1
anchor --version
```

## Repo layout (Phase 0)

- `anchor/` — Anchor workspace (program + tests)
- `app/` — client app (later, Next.js)
- `scripts/` — bootstrap helpers

## Quick start (once Phase 0 spec lands)

We’ll add exact commands after the Phase 0 spec is finalized (local validator workflow + Anchor workspace + TS test harness).
