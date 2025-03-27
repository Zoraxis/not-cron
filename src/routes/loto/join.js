import { games, io } from "../../index.js";
import dotenv from "dotenv";
import { hideAddress } from "../../utils/hideAddress.js";
import { Address } from "@ton/ton";
dotenv.config();

export const JoinedHandle = ({ gameId, address }) => {
  console.log(`user joined game FRFR`, address);
  const addressFreindly = Address.parseRaw(address).toString();
  games[gameId].players.push({
    address: hideAddress(addressFreindly),
    timestamp: Date.now(),
  });
  games[gameId].prize += games[gameId].entry;
  games[gameId].lastUpdated = Date.now();
  io.emit("game.joined", { gameId, address });
};
