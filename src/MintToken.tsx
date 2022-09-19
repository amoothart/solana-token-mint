import { Account, createMint, getAccount, getMint, getOrCreateAssociatedTokenAccount, mintTo, transfer } from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

//Ensure buffer class is setup
window.Buffer = window.Buffer || require("buffer").Buffer

function MintToken() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
  const fromWallet = Keypair.generate()//pays for the transactions
  console.log(`Using new fromWallet keypair: ${fromWallet.publicKey.toBase58()}`)
  let mint: PublicKey
  let fromTokenAccount: Account
  const toWallet = new PublicKey("RyPVSqSMmAg9a6xwkEg7sd1BQLtK5yfmSVFyW36NTpR")

  async function createToken() {
    //fund the account which does the mint
    const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, LAMPORTS_PER_SOL)
    console.log(`have airdrop sig ${fromAirdropSignature}`)

    const latestBlockHash = await connection.getLatestBlockhash()
    console.log(`have latest block hash ${latestBlockHash.blockhash}`)

    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: fromAirdropSignature
    })
    console.log('have confirmed transaction')

    //9 decimals means token is fungible
    mint = await createMint(connection, fromWallet, fromWallet.publicKey, null, 9)
    console.log(`Create token: ${mint.toBase58()}`)

    //Returns public key to the account which was created
    fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, fromWallet.publicKey)
    console.log(`Create Token Account: ${fromTokenAccount.address.toBase58()}`)
  }

  async function mintToken() {
    // 10B is based on the smallest decimal so this is 10 tokens
    const signature = await mintTo(connection, fromWallet, mint, fromTokenAccount.address, fromWallet.publicKey, 10000000000) //10B => 10 tokens
    console.log(`Mint signature: ${signature}`)
  }

  async function checkBalance() {
    const mintInfo = await getMint(connection, mint)
    console.log(mintInfo.supply)

    const tokenAccountInfo = await getAccount(connection, fromTokenAccount.address)
    console.log(tokenAccountInfo.amount)
  }

  async function sendToken() {
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, toWallet)
    console.log(`toTokenAccount ${toTokenAccount.address}`)

    const signature = await transfer(
      connection,
      fromWallet,
      fromTokenAccount.address,
      toTokenAccount.address,
      fromWallet.publicKey,
      1000000000 //1B => 1 token
    )
    console.log(`finished transfer with ${signature}`)
  } 

  return (
    <div>
        Solana Token Mint Dashboard
        <div>
            <button onClick={createToken}>Create Token</button>
            <button onClick={mintToken}>Mint Token</button>
            <button onClick={checkBalance}>Check Balance</button>
            <button onClick={sendToken}>Send Token</button>
        </div>
    </div>
  );
}

export default MintToken;
