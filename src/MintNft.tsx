import { Account, AuthorityType, createMint, createSetAuthorityInstruction, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";

//Ensure buffer class is setup
// window.Buffer = window.Buffer || require("buffer").Buffer

function MintNft() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
  const fromWallet = Keypair.generate()//pays for the transactions
  console.log(`Using new fromWallet keypair: ${fromWallet.publicKey.toBase58()}`)
  let mint: PublicKey
  let fromTokenAccount: Account

  async function createNft() {
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

    //0 decimals means token is non-fungible
    mint = await createMint(connection, fromWallet, fromWallet.publicKey, null, 0)
    console.log(`Create token: ${mint.toBase58()}`)

    //Returns public key to the account which was created
    fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, fromWallet.publicKey)
    console.log(`Create Token Account: ${fromTokenAccount.address.toBase58()}`)
  }

  async function mintNft() {
    // Only 1 token is minted and can ever be minted
    const signature = await mintTo(connection, fromWallet, mint, fromTokenAccount.address, fromWallet.publicKey, 1)
    console.log(`Mint signature: ${signature}`)
  }

  async function lockNft() {
    let transaction = new Transaction().add(createSetAuthorityInstruction(
        mint,
        fromWallet.publicKey,
        AuthorityType.MintTokens,
        null
    ))

    const signature = await sendAndConfirmTransaction(connection, transaction, [fromWallet])
    console.log(`Lock signature: ${signature}`)
  }

  return (
    <div>
        Solana NFT Mint Dashboard
        <div>
            <button onClick={createNft}>Create NFT</button>
            <button onClick={mintNft}>Mint NFT</button>
            <button onClick={lockNft}>Lock NFT</button>
        </div>
    </div>
  );
}

export default MintNft;