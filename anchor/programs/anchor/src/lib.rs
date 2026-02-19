use anchor_lang::prelude::*;

declare_id!("8p7ZHdKM6psXb1wZkMyZdbxBa8yV5DXd5pSdh9WnSFyY");

const HELLO_SEED: &[u8] = b"hello";
const MAX_MESSAGE_BYTES: usize = 64;

#[program]
pub mod anchor {
    use super::*;

    pub fn hello_write(ctx: Context<HelloWrite>, message: String) -> Result<()> {
        if message.as_bytes().len() > MAX_MESSAGE_BYTES {
            return err!(HelloError::MessageTooLong);
        }

        let hello_state = &mut ctx.accounts.hello_state;
        let authority = ctx.accounts.authority.key();

        // init_if_needed leaves account fields at their default values on init.
        if hello_state.authority != Pubkey::default() && hello_state.authority != authority {
            return err!(HelloError::Unauthorized);
        }

        let updated_at = Clock::get()?.unix_timestamp;

        hello_state.authority = authority;
        hello_state.message = message;
        hello_state.updated_at = updated_at;

        emit!(HelloEvent {
            authority,
            message: hello_state.message.clone(),
            updated_at,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct HelloWrite<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        space = HelloState::SPACE,
        seeds = [HELLO_SEED, authority.key().as_ref()],
        bump,
    )]
    pub hello_state: Account<'info, HelloState>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct HelloState {
    pub authority: Pubkey,
    pub message: String,
    pub updated_at: i64,
}

impl HelloState {
    // discriminator + Pubkey + String (4 + 64) + i64
    pub const SPACE: usize = 8 + 32 + 4 + MAX_MESSAGE_BYTES + 8;
}

#[event]
pub struct HelloEvent {
    pub authority: Pubkey,
    pub message: String,
    pub updated_at: i64,
}

#[error_code]
pub enum HelloError {
    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("MessageTooLong")]
    MessageTooLong,
}
