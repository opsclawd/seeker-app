// Anchor TS client library (provider + Program client).
import * as anchor from '@coral-xyz/anchor';
// Web3 primitives we need to derive PDAs and pass system program.
import { PublicKey, SystemProgram } from '@solana/web3.js';

// Shared resolver for repo paths + IDL path + program id (from Anchor.toml/deploy keypair).
import { resolveSeekerEnv } from './env';

// Canonical PDA helper for HelloState.
// seeds = ["hello", authority_pubkey]
const findHelloPda = (programId: PublicKey, authority: PublicKey): [PublicKey, number] => {
  // findProgramAddressSync returns [pda, bump].
  return PublicKey.findProgramAddressSync([Buffer.from('hello'), authority.toBuffer()], programId);
};

async function main() {
  // Resolve the IDL and program id using repo conventions.
  const { idl, programId } = resolveSeekerEnv();

  // Create an Anchor provider from environment variables.
  // Requires ANCHOR_PROVIDER_URL and ANCHOR_WALLET (or Solana CLI default keypair).
  const provider = anchor.AnchorProvider.env();
  // Set this provider as the global default for Anchor.
  anchor.setProvider(provider);

  // Build a Program client from the IDL + program id + provider.
  const program = new anchor.Program(idl, programId, provider);

  // The authority is the provider's wallet public key.
  const authority = provider.wallet.publicKey;
  // Derive the PDA that stores HelloState for this authority.
  const [helloState] = findHelloPda(programId, authority);

  // Send a transaction that calls hello_write("gm").
  const tx = await program.methods
    .helloWrite('gm')
    // Provide the accounts required by the instruction.
    .accounts({
      authority,
      helloState,
      systemProgram: SystemProgram.programId,
    })
    // Actually submit the transaction to the cluster.
    .rpc();

  // Print transaction signature.
  console.log('tx', tx);

  // Read the account back to prove the write succeeded.
  const acct = await program.account.helloState.fetch(helloState);
  // Print a compact view of the state.
  console.log('helloState', {
    authority: acct.authority.toBase58(),
    message: acct.message,
    updatedAt: Number(acct.updatedAt),
  });
}

// Run the script.
main().catch((e) => {
  // Print the error.
  console.error(e);
  // Exit non-zero so shells/CI can detect failure.
  process.exit(1);
});
