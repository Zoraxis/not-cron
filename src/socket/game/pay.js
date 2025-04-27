import { client, games } from "../../index.js";
import { log } from "../../utils/log.js";

export const PaySocketHandle = async ({ gameId, address }) => {
  log(`GAME.JOIN.REQ > G:${gameId} A:${address}`);
  await client.connect();
  const database = client.db("notto");
  const transaction_pool = database.collection("transaction_pool");

  const isAlreadyInPool = await transaction_pool.findOne({ gameId, address });
  if (isAlreadyInPool) return;

  await transaction_pool.insertOne({ gameId, address, entry: games[gameId] });
};
