import { client, games } from "../../index.js";

export const PaySocketHandle = async ({ gameId, address }) => {
  console.log(`user want pay game`, gameId, address);
  await client.connect();
  const database = client.db("notto");
  const transaction_pool = database.collection("transaction_pool");

  const isAlreadyInPool = await transaction_pool.findOne({ gameId, address });
  if (isAlreadyInPool) return;

  await transaction_pool.insertOne({ gameId, address, entry: games[gameId] });
};
