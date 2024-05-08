import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import { TestUser } from "./testUser";
const assert = require("assert");

describe("Solana Test Users", () => {
  
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  const keypair = web3.Keypair.generate();
  const userA = new TestUser(provider.connection, keypair);

  it("an user is initiated with 0 sol balance", async () => {
    const balance = await userA.sol();
    assert(balance == 0);
  });

  it("faucet() should airdrop users the requested sols", async () => {
    await userA.faucet(5);
    const balance = await userA.sol();
    assert(balance >= 5);
  });

  it("the user can sign an anchor transaction", async () => {
    const program = anchor.workspace.SeaCounter as Program<SeaCounter>;
    const [counterPK, bump] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), userA.publicKey.toBuffer()],
      program.programId
    );

    await program.methods.initCounter()
      .accounts({
        owner: userA.publicKey,
        counter: counterPK
      })
      .signers([userA])
      .rpc();

    const counter = await program.account.counter.fetch(counterPK);
    assert.ok(counter.owner.toBase58() === userA.publicKey.toBase58());
  });

  it("mint() should mint the user with requested token", async () => {
    
  });

});
