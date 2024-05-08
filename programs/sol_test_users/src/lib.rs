use anchor_lang::prelude::*;

declare_id!("9uW6NmkG9TmMGfJjd91meyTfdhHQXvcNaAVr4FaBLDSs");

#[program]
pub mod sol_test_users {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
