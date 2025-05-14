import { games, io } from "../../index.js";
import dotenv from "dotenv";
import { hideAddress } from "../../utils/hideAddress.js";
import { log } from "../../utils/log.js";
dotenv.config();

export const JoinedHandle = ({ gameId, address }) => {
  log(
    `GAME.JOIN > G:${gameId} P:[${games[gameId].players.length}] + 1 A${address}`
  );
  const hiddenAddress = hideAddress(address);
  games[gameId].players.push({
    address,
    date: parseInt(Date.now().toString()),
  });
  games[gameId].prize += games[gameId].entry;
  games[gameId].lastUpdated = Date.now();
  io.emit("game.joined", { gameId, address: hiddenAddress });
};
