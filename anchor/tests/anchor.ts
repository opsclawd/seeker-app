import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { assert } from 'chai';
import { SeekerApp } from '../target/types/seeker_app';

describe('phase0 seeker_app', () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.seekerApp as Program<SeekerApp>;

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

  const assertAnchorError = (e: unknown, want: { code?: string; number?: number }) => {
    const anyErr = e as any;

    // AnchorError shape: { error: { errorCode: { code, number }, ... }, program: PublicKey, ... }
    const gotCode = anyErr?.error?.errorCode?.code;
    const gotNumber = anyErr?.error?.errorCode?.number;

    if (want.code) assert.equal(gotCode, want.code);
    if (want.number !== undefined) assert.equal(gotNumber, want.number);

    // Ensure the error context includes this program id (guards against RPC/cluster errors)
    const gotProgramId = anyErr?.program?.toBase58?.();
    assert.equal(gotProgramId, program.programId.toBase58());
  };

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

    // Now attempt to write to A's PDA but claim authority=B. This must fail due to seed constraint.
    let threw = false;
    let caught: unknown;
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
      caught = e;
    }
    assert.isTrue(threw);
    assertAnchorError(caught, { code: 'ConstraintSeeds', number: 2006 });
  });

  it('message too long fails', async () => {
    const authority = provider.wallet.publicKey;
    const [helloState] = findHelloPda(authority);

    const tooLong = 'a'.repeat(65);

    let threw = false;
    let caught: unknown;
    try {
      await program.methods
        .helloWrite(tooLong)
        .accounts({ authority, helloState, systemProgram: SystemProgram.programId })
        .rpc();
    } catch (e) {
      threw = true;
      caught = e;
    }

    assert.isTrue(threw);
    assertAnchorError(caught, { code: 'MessageTooLong' });
  });
});
