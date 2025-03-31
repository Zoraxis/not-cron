import { games, io } from "../../index.js";
import dotenv from "dotenv";
import { hideAddress } from "../../utils/hideAddress.js";
dotenv.config();

export const JoinedHandle = ({ gameId, address }) => {
  console.log(`GAME.JOIN > G:${gameId} P:[${games[gameId].length}] + 1 A${address}`);
  const hiddenAddress = hideAddress(address);
  games[gameId].players.push({
    address,
    timestamp: Date.now(),
  });
  games[gameId].prize += games[gameId].entry;
  games[gameId].lastUpdated = Date.now();
  io.emit("game.joined", { gameId, address: hiddenAddress });
};
