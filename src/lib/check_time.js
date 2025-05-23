import { client, stats } from "../index.js";
import { log } from "../utils/log.js";
import { end_all } from "./end_all.js";

export const check_time = async () => {
  try {
    await client.connect();
    await client.db("notto").command({ ping: 1 });

    const db = client.db("notto");
    const statsDb = db.collection("stats");
    const collection = await db.collection("games").find({}).toArray();

    const stat = await statsDb.findOne({ stat: 1 });
    stats = {
      totalAmount: stat?.prize ?? 0,
      totalPlayers: stat?.players ?? 0,
    };

    const date = Date.now();
    for (let i = 0; i < collection.length; i++) {
      const diff = collection[i].frequency - (date % collection[i].frequency);

      if (diff < 10 * 1000) {
        end_all(collection[i], diff);
      }
    }
  } catch (error) {
    log(error);
  }
};
