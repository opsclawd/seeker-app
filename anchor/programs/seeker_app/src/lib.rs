// Anchor prelude pulls in common Solana/Anchor types (Context, Account, Signer, Result, Clock, Pubkey, etc.).
use anchor_lang::prelude::*;

// The program id this program is deployed/compiled with. Must match Anchor.toml for localnet.
declare_id!("8p7ZHdKM6psXb1wZkMyZdbxBa8yV5DXd5pSdh9WnSFyY");

// Static seed prefix for the HelloState PDA.
const HELLO_SEED: &[u8] = b"hello";
// Max allowed message payload in BYTES (not chars).
const MAX_MESSAGE_BYTES: usize = 64;

// Program entrypoint module. The module name becomes the IDL/program namespace.
#[program]
pub mod seeker_app {
    // Bring outer scope items into the program module.
    use super::*;

    /// Writes `message` into the caller's HelloState PDA (init if needed, otherwise update).
    pub fn hello_write(ctx: Context<HelloWrite>, message: String) -> Result<()> {
        // Enforce the fixed upper bound so account sizing stays deterministic.
        if message.as_bytes().len() > MAX_MESSAGE_BYTES {
            // Return our custom program error.
            return err!(HelloError::MessageTooLong);
        }

        // Mutable handle to the PDA account (created by init_if_needed if missing).
        let hello_state = &mut ctx.accounts.hello_state;
        // The signer public key that is authorizing this write.
        let authority = ctx.accounts.authority.key();

        // If this account already exists, it must be owned by the same authority.
        // (On first init, authority field will still be default pubkey until we set it.)
        if hello_state.authority != Pubkey::default() && hello_state.authority != authority {
            return err!(HelloError::Unauthorized);
        }

        // Get the current on-chain unix timestamp.
        let updated_at = Clock::get()?.unix_timestamp;

        // Persist state to the account.
        hello_state.authority = authority;
        hello_state.message = message;
        hello_state.updated_at = updated_at;

        // Emit an event for off-chain indexing/observability.
        emit!(HelloEvent {
            authority,
            // Clone the stored message so the event matches what we wrote.
            message: hello_state.message.clone(),
            updated_at,
        });

        // Signal success.
        Ok(())
    }
}

// Accounts context for `hello_write`.
#[derive(Accounts)]
pub struct HelloWrite<'info> {
    // The user signing and paying for account creation/updates.
    #[account(mut)]
    pub authority: Signer<'info>,

    // PDA-backed state account at seeds = ["hello", authority].
    #[account(
        // Create the PDA if missing; otherwise load it for update.
        init_if_needed,
        // Authority pays rent/fees when the account is created.
        payer = authority,
        // Fixed size allocation so we never need realloc in Phase 0.
        space = HelloState::SPACE,
        // Enforce the canonical PDA derivation so arbitrary accounts are rejected.
        seeds = [HELLO_SEED, authority.key().as_ref()],
        // Bump is derived by Anchor and stored implicitly in the PDA derivation.
        bump,
    )]
    pub hello_state: Account<'info, HelloState>,

    // Needed for system account creation during init_if_needed.
    pub system_program: Program<'info, System>,
}

// On-chain account layout stored at the PDA.
#[account]
pub struct HelloState {
    // Who is allowed to mutate this PDA.
    pub authority: Pubkey,
    // Stored message (bounded to MAX_MESSAGE_BYTES by instruction validation).
    pub message: String,
    // Last update time.
    pub updated_at: i64,
}

impl HelloState {
    // Anchor account size (bytes):
    // 8  = discriminator
    // 32 = Pubkey
    // 4  = String prefix (u32 length)
    // 64 = max message bytes
    // 8  = i64
    pub const SPACE: usize = 8 + 32 + 4 + MAX_MESSAGE_BYTES + 8;
}

// Structured event emitted on every successful write.
#[event]
pub struct HelloEvent {
    // The authority that performed the write.
    pub authority: Pubkey,
    // The message that was written.
    pub message: String,
    // The timestamp of the write.
    pub updated_at: i64,
}

// Custom program errors (stable identifiers for tests/clients).
#[error_code]
pub enum HelloError {
    // Returned when attempting to write to an existing PDA owned by a different authority.
    #[msg("Unauthorized")]
    Unauthorized,

    // Returned when message.as_bytes().len() > 64.
    #[msg("MessageTooLong")]
    MessageTooLong,
}
