import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import { TestUser } from "./testUser";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";
const assert = require("assert");

describe("Solana Test Users", () => {
  
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  const keypair = web3.Keypair.generate();
  let userA: TestUser = undefined;

  it("test user is initiated with 5 sol", async () => {
    userA = await TestUser.fromKeypair(provider.connection, keypair);
    const balance = await userA.sol();
    assert(balance > 0);
  });

  it("test user can sign an anchor transaction", async () => {
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

  it("mint() should mint test user the requested token", async () => {
    let amount = await userA.balance("USDC");
    assert.ok(amount == 0);
    
    await userA.mint("USDC").commit();
    assert.ok(userA.tokens["USDC"] instanceof web3.PublicKey);
    assert.ok(userA.tokenAccounts["USDC"] instanceof web3.PublicKey);
    
    amount = await userA.balance("USDC");
    assert.ok(amount > 0);
  });

  it("transfer() should transfer tokens to another test user", async () => {
    const userB = await TestUser.generate(provider.connection);
    let amount = await userB.balance("USDC");
    assert.ok(amount == 0);

    await userA.transfer(userB, "USDC", 500).commit();
    assert.ok(userB.tokens["USDC"].toBase58() == userA.tokens["USDC"].toBase58());
    assert.ok(userB.tokenAccounts["USDC"] instanceof web3.PublicKey);
    
    amount = await userB.balance("USDC");
    assert.ok(amount > 0);
  });

  // it("user instructions can be chained together", async () => {
    
  // });

});

