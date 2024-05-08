import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

export class TestUser extends Keypair {

    constructor(conn: Connection, keypair: Keypair) {
        super(keypair);
        this.conn = conn;
    }

    async sol() {
        // console.log("PublicKey >>>", super.publicKey);
        const lamports = await this.conn.getBalance(super.publicKey);
        // console.log("lamports >>>", lamports)
        return lamports / LAMPORTS_PER_SOL;
    }

    async faucet(sol) {
        const tx = await this.conn.requestAirdrop(super.publicKey, sol * LAMPORTS_PER_SOL);
        await this.conn.confirmTransaction(tx);
    }
}