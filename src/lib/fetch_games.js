import { games } from "../index.js";
import { gameGetHandler } from "../utils/gameGet.js";

export const fetch_games = async () => {
  for (let i = 1; i <= 4; i++) {
    const game = await gameGetHandler(i);
    let changed = false;

    if (game.players.length !== games[i].players.length) changed = true;
    if (game.address !== games[i].address) changed = true;
    if (game.prize !== games[i].prize) changed = true;

    if (changed) game.lastUpdated = Date.now();
    games[i] = game;
  }
};
