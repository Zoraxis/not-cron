import { client, io } from "../index.js";
import { end_game } from "./end_game.js";
import { end_results } from "./end_results.js";
import { end_server } from "./end_server.js";

export const check_time = async () => {
  try {
    await client.connect();
    await client.db("notto").command({ ping: 1 });

    const database = client.db("notto");
    const collection = await database.collection("games").find({}).toArray();

    const date = Date.now();
    for (let i = 0; i < collection.length; i++) {
      const diff = collection[i].frequency - (date % collection[i].frequency);

      if (diff < interval * 1000) {
        const { gameId, address } = collection[i];
        const gameClone = JSON.parse(JSON.stringify(games[gameId]));
        games[gameId].players = [];
        games[gameId].prize = 0;
        games[gameId].lastUpdated = Date.now();
        if (collection[i]?.players?.length <= 0) continue;
        console.log("==============================");
        console.log("==============================");
        console.log(`GAME.ENDING > G:${gameId}`);
        console.log(address);
        end_game(address);
        setTimeout(async () => {
          console.log(
            `END.EMIT > G:${gameId} P:${collection[i]?.players?.length}`
          );
          end_server(gameId);
          setTimeout(() => {
            io.emit("game.ended", gameClone);
          }, 1000 * 15);

          if (collection[i]?.players?.length > 1) {
            setTimeout(() => {
              end_results(gameClone);
            }, 1000 * 10);
          }
        }, diff - 200);
      }
    }
  } catch (error) {
    console.log("Error:", error);
  }
};
