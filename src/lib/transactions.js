import { Address, Cell, Dictionary, toNano, TonClient } from "@ton/ton";
import { games, tonClient } from "../index.js";
import dotenv from "dotenv";
import { PayedSocketHandle } from "../socket/game/payed.js";
import { sleep } from "../utils/sleep.js";
import { log } from "../utils/log.js";
dotenv.config();

export const check_transaction = async (gameId) => {
  try {
    const rawAddress = Address.parseFriendly(
      games[gameId].address
    ).address.toRawString();
    const data = await tonClient.runMethod(rawAddress, "get_players", []);

    const cell = Cell.fromBoc(Buffer.from(data?.stack[0].cell, "hex"))[0];
    const playersCell = Dictionary.loadDirect(
      Dictionary.Keys.Uint(8),
      Dictionary.Values.Address(),
      cell
    );
    const players = playersCell.values();
    const filteredPlayers = Array.from(players).filter(
      (player) =>
        !games[gameId].players
          .map((x) => x.address)
          .includes(player.toRawString())
    );

    if (filteredPlayers.length === 0) {
      log("NO |NEW| PLAYERS", "transactions");
      return;
    }

    for (const player of filteredPlayers) {
      PayedSocketHandle({ gameId, address: player.toRawString() });
    }
    games[gameId].prize += games[gameId].entry * filteredPlayers.length;
    log("GAME JOINED:", "transactions");
    log(filteredPlayers, "transactions");
  } catch (e) {
    log("NO PLAYERS", "transactions");
  }
};

const gameIds = [1, 2, 3, 4];

export const check_transactions = async () => {
  for (const id of gameIds) {
    await check_transaction(id);
    await sleep(600);
  }
  log("==============", "transactions");
};