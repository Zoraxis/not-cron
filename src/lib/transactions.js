import { Address, toNano } from "@ton/ton";
import { client } from "../index.js";
import axios from "axios";
import dotenv from "dotenv";
import { PayedSocketHandle } from "../socket/game/payed.js";
dotenv.config();

const { TONAPI_KEY } = process.env;
const TONAPI_URL = "https://testnet.tonapi.io/v2/";

async function checkTransaction(game, database) {
  let found = 0;
  let awaiting = 0;
  let errors = 0;
  try {
    const { gameId, address, lastFetchedLt } = game;
    const correctAddress = Address.parseFriendly(address).address.toString();

    const games = database.collection("games");
    const transaction_pool = database.collection("transaction_pool");

    // Get transactions for the contract
    // const txResponse = await axios.get(
    //   `${TONCENTER_API_URL}getTransactions?api_key=${TONCENTER_KEY}&address=${correctAddress}&lt=${
    //     lastFetchedLt ?? 0
    //   }`
    // );

    const awaitingTransactions = await transaction_pool
      .find({ gameId })
      .toArray();

    if (awaitingTransactions.length == 0) return "-:-";

    const txResponse = await axios.get(
      `${TONAPI_URL}blockchain/accounts/${correctAddress}/transactions?after_lt=${
        lastFetchedLt ?? 31650441000000
      }`,
      {
        headers: {
          Authorization: `Bearer ${TONAPI_KEY}`,
        },
      }
    );
    const transactions = txResponse.data.transactions;

    found = transactions.length;
    for (let i = 0; i < transactions.length; i++) {
      // console.log("New transaction detected:", transactions[i]);
      if (i === transactions.length - 1) {
        const { lt } = transactions[i];
        await games.updateOne({ gameId }, { $set: { lastFetchedLt: lt } });
      }

      // TODO: Check if transaction is incoming
      const source = transactions[i].in_msg?.source.address;

      const isAwaiting = awaitingTransactions.find(
        (at) => at.address == source
      );
      if (!isAwaiting) {
        continue;
      }

      awaiting++;
      const { value } = transactions[i].in_msg;
      console.log("Transaction value:", value, toNano(game.entry));
      const isPaid = BigInt(value) >= toNano(game.entry);

      if (!isPaid) continue;

      PayedSocketHandle({
        gameId,
        address: isAwaiting.address,
      });
    }
  } catch (error) {
    errors++;
  }

  return `${found}:${awaiting}${errors > 0 ? `-${errors}` : ""}`;
}

export const check_transactions = async () => {
  await client.connect();
  const database = client.db("notto");
  const games = database.collection("games");
  const allGames = await games.find({}).toArray();
  let reportString = "";
  for (const game of allGames) {
    const res = await checkTransaction(game, database);
    reportString += `${res} `;
  }
  // console.log(reportString);
};
