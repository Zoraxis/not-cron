import { games, io } from "../index.js";
import { log } from "../utils/log.js";
import { end_game } from "./end_game.js";
import { end_results } from "./end_results.js";
import { end_server } from "./end_server.js";

export const end_all = async (game, diff) => {
  if (game?.players?.length <= 0) return;
  const { gameId, address } = game;
  log(games[gameId]);
  const gameClone = JSON.parse(JSON.stringify(games[gameId]));
  log("==============================");
  log("==============================");
  log(`GAME.ENDING > G:${gameId}`);
  log(address);
  end_game(address, gameId);
  const endetAt = parseInt(Date.now().toString());
  setTimeout(async () => {
    log(`END.EMIT > G:${gameId} P:${game?.players?.length}`);
    setTimeout(() => {
      games[gameId].players = [];
      games[gameId].prize = 0;
      games[gameId].lastUpdated = Date.now();
      end_server(gameId);
    }, 1000 * 10);

    setTimeout(() => {
      io.emit("game.ended", gameClone);
    }, 1000 * 15);

    if (game?.players?.length > 1) {
      setTimeout(() => {
        end_results(gameClone, endetAt);
      }, 1000 * 10);
    }
  }, diff - 200);
};
