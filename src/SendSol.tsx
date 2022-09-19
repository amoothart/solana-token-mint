import { closeAccount, createAssociatedTokenAccountInstruction, createSyncNativeInstruction, getAccount, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount, NATIVE_MINT, transfer } from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";

//Ensure buffer class is setup
// window.Buffer = window.Buffer || require("buffer").Buffer

function SendSol() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
  const fromWallet = Keypair.generate()//pays for the transactions
  console.log(`Using new fromWallet keypair: ${fromWallet.publicKey.toBase58()}`)
  let associatedTokenAccount: PublicKey

  async function wrapSol() {
    const airdropSignature = await connection.requestAirdrop(fromWallet.publicKey, 2 * LAMPORTS_PER_SOL)
    console.log(`have airdrop sig ${airdropSignature}`)

    const latestBlockHash = await connection.getLatestBlockhash()
    console.log(`have latest block hash ${latestBlockHash.blockhash}`)

    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropSignature
    })
    console.log('have confirmed transaction')

    associatedTokenAccount = await getAssociatedTokenAddress(NATIVE_MINT, fromWallet.publicKey)
    console.log(`Associated token account: ${associatedTokenAccount.toBase58()}`)

    const ataTransaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
            fromWallet.publicKey,
            associatedTokenAccount,
            fromWallet.publicKey,
            NATIVE_MINT
        )
    )

    await sendAndConfirmTransaction(connection, ataTransaction, [fromWallet])

    const solTransferTransaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: fromWallet.publicKey,
            toPubkey: associatedTokenAccount,
            lamports: LAMPORTS_PER_SOL
        }),
        createSyncNativeInstruction( //keeps SOL balance in sync across wallets
            associatedTokenAccount
        )
    )

    await sendAndConfirmTransaction(connection, solTransferTransaction, [fromWallet])
    const accountInfo = await getAccount(connection, associatedTokenAccount)
    console.log(`Native: ${accountInfo.isNative}, Lamports: ${accountInfo.amount}`)
  }

  async function unwrapSol() {
    const walletBalance = await connection.getBalance(fromWallet.publicKey)
    console.log(`Balance before unwapping WSOL: ${walletBalance}`)
    await closeAccount(
        connection,
        fromWallet,
        associatedTokenAccount,
        fromWallet.publicKey,
        fromWallet
    )
    const walletBalancePostClose = await connection.getBalance(fromWallet.publicKey)
    console.log(`Balance before unwapping WSOL: ${walletBalancePostClose}`)
  }

  async function sendSol() {
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

    const toWallet = new PublicKey("RyPVSqSMmAg9a6xwkEg7sd1BQLtK5yfmSVFyW36NTpR")

    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, NATIVE_MINT, fromWallet.publicKey)

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, NATIVE_MINT, toWallet)

    const signature = await transfer(
        connection,
        fromWallet,
        fromTokenAccount.address,
        toTokenAccount.address,
        fromWallet.publicKey,
        LAMPORTS_PER_SOL //1B => 1 token
      )
      console.log(`finished transfer with ${signature}`)
  }

  return (
    <div>
        Solana Send Sol Dashboard
        <div>
            <button onClick={wrapSol}>Wrap Sol</button>
            <button onClick={unwrapSol}>Unwrap Sol</button>
            <button onClick={sendSol}>Send Sol</button>
        </div>
    </div>
  );
}

export default SendSol;