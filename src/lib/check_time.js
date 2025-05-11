import { client } from "../index.js";
import { log } from "../utils/log.js";
import { end_all } from "./end_all.js";

export const check_time = async () => {
  try {
    await client.connect();
    await client.db("notto").command({ ping: 1 });

    const database = client.db("notto");
    const collection = await database.collection("games").find({}).toArray();

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
