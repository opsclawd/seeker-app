# seeker-app

Solana App Builder repo (pinned toolchain). This repo is intended to evolve module-by-module (no throwaway demos).

## Bootcamp docs

- `SPEC.md` — current phase contract (spec is law)
- `AGENT.md` — execution protocol (artifact-first, no scope creep)
- `PROMPT.md` — single-prompt benchmark runner input

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

**Option A: Agave installer (GitHub release asset)**

```bash
# Linux x86_64 example
gh release download v2.3.0 --repo anza-xyz/agave --pattern 'agave-install-init-x86_64-unknown-linux-gnu'
chmod +x agave-install-init-x86_64-unknown-linux-gnu
./agave-install-init-x86_64-unknown-linux-gnu v2.3.0

export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version
```

If `anchor test` errors about missing platform tools, install the SBF SDK deps:

```bash
# installs platform-tools into ~/.cache/solana/v1.48/
bash "$HOME/.cache/solana/v1.48/sbf-sdk/scripts/install.sh"
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
- `scripts/` — TS script harness(es)

## Phase 0 (localnet)

### Install deps

Repo root (script harness tooling):

```bash
# if pnpm isn't installed yet
npm i -g pnpm@10.29.3

pnpm install
```

Anchor workspace (tests tooling):

```bash
cd anchor
pnpm install --frozen-lockfile
```

### Build

```bash
cd anchor
anchor build
```

### Run tests (deterministic localnet)

```bash
cd anchor
anchor test
```

### Run script (`scripts/hello.ts`)

Note: the script reads the built IDL at `anchor/target/idl/seeker_app.json`, so you must run `anchor build` first.

Terminal 1 (local validator):

```bash
# Optional: fail fast if the default localnet RPC port is already in use (Linux/macOS)
command -v lsof >/dev/null 2>&1 && lsof -i :8899 || true

export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana-test-validator --reset
```

Terminal 2 (build IDL + run script):

```bash
cd anchor
anchor build

cd ..
export ANCHOR_PROVIDER_URL=http://127.0.0.1:8899
pnpm hello
```
