import { games, io } from "../../index.js";
import dotenv from "dotenv";
dotenv.config();

export const JoinedHandle = ({ gameId, address }) => {
  console.log(`user joined game FRFR`, address);
  games[gameId].players.push({
    address,
    timestamp: Date.now(),
  });
  games[gameId].prize += games[gameId].entry;
  games[gameId].lastUpdated = Date.now();
  io.emit("game.joined", { gameId, address });
};
