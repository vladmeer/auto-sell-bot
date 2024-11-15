import base58 from "bs58"
import { logger, retrieveEnvVariable, sleep } from "./utils"
import { Connection, Keypair, TransactionInstruction } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SPL_ACCOUNT_LAYOUT, TokenAccount } from "@raydium-io/raydium-sdk";
import { getSellTxWithJupiter } from "./utils/swapOnlyAmm";
import { execute } from "./executor/legacy";
import { RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT } from "./constants";

export const solanaConnection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT, commitment: "processed"
})

const rpcUrl = retrieveEnvVariable("RPC_ENDPOINT", logger);
const mainKpStr = retrieveEnvVariable('PRIVATE_KEY', logger);
const connection = new Connection(rpcUrl, { commitment: "processed" });
const mainKp = Keypair.fromSecretKey(base58.decode(mainKpStr))

const main = async () => {
  try {
    const tokenAccounts = await connection.getTokenAccountsByOwner(mainKp.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    },
      "confirmed"
    )
    const accounts: TokenAccount[] = [];

    if (tokenAccounts.value.length > 0)
      for (const { pubkey, account } of tokenAccounts.value) {
        accounts.push({
          pubkey,
          programId: account.owner,
          accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data),
        });
      }

    for (let j = 0; j < accounts.length; j++) {
      const tokenBalance = (await connection.getTokenAccountBalance(accounts[j].pubkey)).value

      let i = 0
      while (true) {
        if (i > 10) {
          console.log("Sell error before gather")
          break
        }
        if (tokenBalance.uiAmount == 0) {
          break
        }
        try {
          const sellTx = await getSellTxWithJupiter(mainKp, accounts[j].accountInfo.mint, tokenBalance.amount)
          if (sellTx == null) {
            // console.log(`Error getting sell transaction`)
            throw new Error("Error getting sell tx")
          }
          await execute(sellTx, false);
          break
        } catch (error) {
          i++
        }
      }
    }
  } catch (error) {
    console.log("🚀 ~ wallets.map ~ error:", error)
    console.log("transaction error while gathering")
    return
  }
}

main()