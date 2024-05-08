import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import { TestUser } from "./testUser";
const assert = require("assert");

describe("sol_test_users", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  const keypair = web3.Keypair.generate();
  const userA = new TestUser(provider.connection, keypair);

  it("an user is initiated with 0 sol balance", async () => {
    const balance = await userA.sol();
    assert(balance === 0);
  });

  it("faucet() should airdrop users the requested sols", async () => {
    await userA.faucet(5);
    const balance = await userA.sol();
    assert(balance === 5);
  });

  // it("the user can sign an anchor transaction", async () => {});


});
