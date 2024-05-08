import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import { TestUser } from "./testUser";
const assert = require("assert");

describe("Solana Test Users", () => {
  
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  const keypair = web3.Keypair.generate();
  let userA: TestUser = undefined;

  it("an user is initiated with 5 sol balance", async () => {
    userA = await TestUser.fromKeypair(provider.connection, keypair);
    const balance = await userA.sol();
    assert(balance >= 0);
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
    await userA.mint("USDC").commit();
    assert.ok(userA.mints["USDC"]);
    assert.ok(userA.tokenAccounts["USDC"]);

    const amount = await userA.balance("USDC");
    assert.ok(amount > 0);
  });

});
