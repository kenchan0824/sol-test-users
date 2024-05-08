import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

export class TestUser extends Keypair {

    constructor(conn: Connection, keypair: Keypair) {
        super(keypair);
        this._conn = conn;
    }

    async sol() {
        // console.log("PublicKey >>>", super.publicKey);
        const lamports = await this._conn.getBalance(super.publicKey);
        // console.log("lamports >>>", lamports)
        return lamports / LAMPORTS_PER_SOL;
    }
}