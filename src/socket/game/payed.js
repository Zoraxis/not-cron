import axios from "axios";
import { client } from "../../index.js";
dotenv.config();

export const PayedSocketHandle = async ({ gameId, address, boc }) => {
  const { ULTRA_MEGA_SUPER_SECRET, API_URL } = process.env;
  console.log(`user payed game`, gameId, address);
  await client.connect();
  const database = client.db("notto");
  const games = database.collection("games");
  const transaction_pool = database.collection("transaction_pool");

  await transaction_pool.deleteOne({
    gameId,
    address,
  });

  const res = await axios.post(`${API_URL}/loto/${gameId}/played`, {
    secret: ULTRA_MEGA_SUPER_SECRET,
    address,
  });
};
