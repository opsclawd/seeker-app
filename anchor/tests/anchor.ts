import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { assert } from 'chai';
import { Anchor } from '../target/types/anchor';

describe('phase0', () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.anchor as Program<Anchor>;

  const findHelloPda = (authority: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync([Buffer.from('hello'), authority.toBuffer()], program.programId);
  };

  const airdrop = async (pubkey: PublicKey, sol = 2) => {
    const sig = await provider.connection.requestAirdrop(
      pubkey,
      sol * anchor.web3.LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, 'confirmed');
  };

  it('hello_write initializes and stores message', async () => {
    const authority = provider.wallet.publicKey;
    const [helloState] = findHelloPda(authority);

    await program.methods
      .helloWrite('gm')
      .accounts({
        authority,
        helloState,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const acct = await program.account.helloState.fetch(helloState);
    assert.equal(acct.authority.toBase58(), authority.toBase58());
    assert.equal(acct.message, 'gm');
    assert.instanceOf(acct.updatedAt, anchor.BN);
  });

  it('hello_write updates message on second call', async () => {
    const authority = provider.wallet.publicKey;
    const [helloState] = findHelloPda(authority);

    await program.methods
      .helloWrite('one')
      .accounts({ authority, helloState, systemProgram: SystemProgram.programId })
      .rpc();

    const a1 = await program.account.helloState.fetch(helloState);

    await program.methods
      .helloWrite('two')
      .accounts({ authority, helloState, systemProgram: SystemProgram.programId })
      .rpc();

    const a2 = await program.account.helloState.fetch(helloState);

    assert.equal(a2.authority.toBase58(), authority.toBase58());
    assert.equal(a2.message, 'two');
    assert.isAtLeast(a2.updatedAt.toNumber(), a1.updatedAt.toNumber());
  });

  it("wrong signer cannot write to someone else’s PDA", async () => {
    const authorityA = Keypair.generate();
    const authorityB = Keypair.generate();

    await airdrop(authorityA.publicKey);
    await airdrop(authorityB.publicKey);

    const [helloStateA] = findHelloPda(authorityA.publicKey);

    // Initialize A's PDA with A signer.
    await program.methods
      .helloWrite('hi')
      .accounts({
        authority: authorityA.publicKey,
        helloState: helloStateA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authorityA])
      .rpc();

    // Now attempt to write to A's PDA but claim authority=B. This should fail
    // because the PDA seeds must match ("hello", authority).
    let threw = false;
    try {
      await program.methods
        .helloWrite('nope')
        .accounts({
          authority: authorityB.publicKey,
          helloState: helloStateA,
          systemProgram: SystemProgram.programId,
        })
        .signers([authorityB])
        .rpc();
    } catch (e) {
      threw = true;
    }
    assert.isTrue(threw);
  });

  it('message too long fails', async () => {
    const authority = provider.wallet.publicKey;
    const [helloState] = findHelloPda(authority);

    const tooLong = 'a'.repeat(65);

    let threw = false;
    try {
      await program.methods
        .helloWrite(tooLong)
        .accounts({ authority, helloState, systemProgram: SystemProgram.programId })
        .rpc();
    } catch (e) {
      threw = true;
    }

    assert.isTrue(threw);
  });
});
