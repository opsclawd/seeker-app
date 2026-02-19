import fs from 'node:fs';
import path from 'node:path';
import { PublicKey } from '@solana/web3.js';

export type SeekerEnv = {
  repoRoot: string;
  anchorDir: string;
  idlPath: string;
  idl: any;
  programId: PublicKey;
  providerUrl: string;
};

export function resolveSeekerEnv(repoRoot = path.resolve(__dirname, '..')): SeekerEnv {
  const anchorDir = path.join(repoRoot, 'anchor');
  const idlPath = path.join(anchorDir, 'target', 'idl', 'seeker_app.json');

  if (!fs.existsSync(idlPath)) {
    throw new Error(`IDL not found at ${idlPath}. Run: (cd anchor && anchor build)`);
  }

  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

  const programId = new PublicKey(idl.address);

  const providerUrl = process.env.ANCHOR_PROVIDER_URL ?? '';
  if (!providerUrl) {
    throw new Error('ANCHOR_PROVIDER_URL is not defined');
  }

  return { repoRoot, anchorDir, idlPath, idl, programId, providerUrl };
}
