import * as anchor from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';

import { resolveSeekerEnv } from './env';

const findHelloPda = (programId: PublicKey, authority: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync([Buffer.from('hello'), authority.toBuffer()], programId);
};

async function main() {
  const { idl, programId } = resolveSeekerEnv();

  // Uses ANCHOR_PROVIDER_URL + ANCHOR_WALLET (or Solana CLI default keypair) when present.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new anchor.Program(idl, programId, provider);

  const authority = provider.wallet.publicKey;
  const [helloState] = findHelloPda(programId, authority);

  const tx = await program.methods
    .helloWrite('gm')
    .accounts({
      authority,
      helloState,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('tx', tx);

  const acct = await program.account.helloState.fetch(helloState);
  console.log('helloState', {
    authority: acct.authority.toBase58(),
    message: acct.message,
    updatedAt: Number(acct.updatedAt),
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
