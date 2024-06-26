import {
  Connection, Keypair, Signer, PublicKey, Transaction, sendAndConfirmTransaction,
  SystemProgram, LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {
  createInitializeMintInstruction, getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, 
  createMintToInstruction, createTransferInstruction,
  MINT_SIZE, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";


export class TestUser extends Keypair {

  conn: Connection;
  rent: number;
  txn: Transaction;
  signers: Signer[];
  tokens: { [index: string]: PublicKey };
  tokenAccounts: { [index: string]: PublicKey };

  private constructor(conn: Connection, keypair: Keypair, rent: number) {
    super(keypair);
    this.conn = conn;
    this.rent = rent;
    this.txn = new Transaction();
    this.signers = [];
    this.tokens = {};
    this.tokenAccounts = {}
  }

  static async fromKeypair(conn: Connection, keypair: Keypair) {
    const rent = await getMinimumBalanceForRentExemptMint(conn);
    const user = new TestUser(conn, keypair, rent);
    await user.faucet(5);
    return user;
  }

  static async generate(conn: Connection) {
    const keypair = Keypair.generate();
    return await this.fromKeypair(conn, keypair);
  }

  async sol() {
    const lamports = await this.conn.getBalance(super.publicKey);
    return lamports / LAMPORTS_PER_SOL;
  }

  async faucet(sol: number) {
    const tx = await this.conn.requestAirdrop(super.publicKey, sol * LAMPORTS_PER_SOL);
    await this.conn.confirmTransaction(tx);
  }

  mint(symbol: String) {
    const mint = Keypair.generate();
    this.tokens[symbol] = mint.publicKey;

    const tokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      this.publicKey,
      false, // allowOwnerOffCurve
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );   
    this.tokenAccounts[symbol] = tokenAccount;

    this.txn.add(
      // create mint account
      SystemProgram.createAccount({
        fromPubkey: this.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports: this.rent,
        programId: TOKEN_PROGRAM_ID,
      }),
      // init mint
      createInitializeMintInstruction(
        mint.publicKey, // mint pubkey
        9, // decimals
        this.publicKey, // mint authority
        null // freeze authority
      ),
      // create token account
      createAssociatedTokenAccountInstruction(
        this.publicKey, // payer
        tokenAccount, 
        this.publicKey, // owner
        mint.publicKey, // mint
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      // mint to token account
      createMintToInstruction(
        mint.publicKey, // mint
        tokenAccount, // destination
        this.publicKey, // authority 
        Math.pow(10, 19), // amount 
        [], // multiSigners 
        TOKEN_PROGRAM_ID
      )
    );
    this.signers.push(this, mint, this, this);
    return this;
  }

  async commit() {
    if (this.txn.instructions.length == 0) return;
    await sendAndConfirmTransaction(this.conn, this.txn, this.signers);
    this.reset();
  }

  reset() {
    this.txn = new Transaction();
    this.signers = [];
  }

  async balance(symbol: string) {
    const tokenAccount = this.tokenAccounts[symbol]
    if (!tokenAccount) return 0;

    const { value } = await this.conn.getTokenAccountBalance(tokenAccount);
    return value.amount / Math.pow(10, value.decimals);
  }

  transfer(another: TestUser, symbol: string, amount: number) {
    let destination = another.tokenAccounts[symbol];
    if (!destination) {
      const mint = this.tokens[symbol]
      another.tokens[symbol] = mint;

      const tokenAccount = getAssociatedTokenAddressSync(
        mint,
        another.publicKey,
        false, // allowOwnerOffCurve
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );   
      another.tokenAccounts[symbol] = tokenAccount;
      destination = tokenAccount;

      this.txn.add(
        // create token account
        createAssociatedTokenAccountInstruction(
          this.publicKey, // payer
          tokenAccount, 
          another.publicKey, // owner
          mint, // mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
      );
      this.signers.push(this);
    }

    this.txn.add(
      createTransferInstruction(
        this.tokenAccounts[symbol], 
        destination, 
        this.publicKey, 
        amount * Math.pow(10, 9), 
        [], // multiSigners 
        TOKEN_PROGRAM_ID
      )
    );
    this.signers.push(this);
    return this;
  }
}