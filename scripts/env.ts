import fs from 'node:fs';
import path from 'node:path';
import { Keypair, PublicKey } from '@solana/web3.js';

export type SeekerEnv = {
  repoRoot: string;
  anchorDir: string;
  anchorTomlPath: string;
  idlPath: string;
  idl: any;
  programId: PublicKey;
  providerUrl: string;
};

function readProgramIdFromAnchorToml(anchorToml: string): string | null {
  // Minimal TOML parsing: locate [programs.localnet] section, then seeker_app = "<pubkey>".
  // We treat Anchor.toml as source-of-truth for identity.
  const sectionMatch = anchorToml.match(/\[programs\.localnet\]([\s\S]*?)(\n\[|$)/);
  if (!sectionMatch) return null;
  const sectionBody = sectionMatch[1];
  const keyMatch = sectionBody.match(/\n?seeker_app\s*=\s*"([1-9A-HJ-NP-Za-km-z]{32,44})"/);
  return keyMatch?.[1] ?? null;
}

function readProgramIdFromDeployKeypair(deployKeypairPath: string): PublicKey | null {
  if (!fs.existsSync(deployKeypairPath)) return null;
  const secret = JSON.parse(fs.readFileSync(deployKeypairPath, 'utf8')) as number[];
  const kp = Keypair.fromSecretKey(Uint8Array.from(secret));
  return kp.publicKey;
}

export function resolveSeekerEnv(repoRoot = path.resolve(__dirname, '..')): SeekerEnv {
  const anchorDir = path.join(repoRoot, 'anchor');
  const anchorTomlPath = path.join(anchorDir, 'Anchor.toml');
  const idlPath = path.join(anchorDir, 'target', 'idl', 'seeker_app.json');

  if (!fs.existsSync(idlPath)) {
    throw new Error(`IDL not found at ${idlPath}. Run: (cd anchor && anchor build)`);
  }
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

  // Program identity should NOT come from IDL. Prefer Anchor.toml, then deploy keypair.
  let programId: PublicKey | null = null;

  if (fs.existsSync(anchorTomlPath)) {
    const toml = fs.readFileSync(anchorTomlPath, 'utf8');
    const programIdStr = readProgramIdFromAnchorToml(toml);
    if (programIdStr) programId = new PublicKey(programIdStr);
  }

  if (!programId) {
    const deployKeypairPath = path.join(anchorDir, 'target', 'deploy', 'seeker_app-keypair.json');
    programId = readProgramIdFromDeployKeypair(deployKeypairPath);
  }

  if (!programId) {
    throw new Error(
      `Unable to determine program id. Expected it in ${anchorTomlPath} ([programs.localnet].seeker_app) ` +
        `or in anchor/target/deploy/seeker_app-keypair.json.`,
    );
  }

  const providerUrl = process.env.ANCHOR_PROVIDER_URL ?? '';
  if (!providerUrl) {
    throw new Error('ANCHOR_PROVIDER_URL is not defined');
  }

  return { repoRoot, anchorDir, anchorTomlPath, idlPath, idl, programId, providerUrl };
}
