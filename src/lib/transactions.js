import { Address, Cell, Dictionary, toNano, TonClient } from "@ton/ton";
import { games } from "../index.js";
import dotenv from "dotenv";
import { PayedSocketHandle } from "../socket/game/payed.js";
import { sleep } from "../utils/sleep.js";
import { log } from "../utils/log.js";
dotenv.config();

export const check_transaction = async (gameId) => {
  try {
    const client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
    });
    const res = await client.runMethod(
      Address.parse(games[gameId].address),
      "get_players"
    );
    if (!res) {
      return;
    }

    const cell = Cell.fromBoc(Buffer.from(res?.stack[0].cell, "hex"))[0];

    const playersCell = Dictionary.loadDirect(
      Dictionary.Keys.Uint(8),
      Dictionary.Values.Address(),
      cell
    );
    const players = playersCell.values();
    const filteredPlayers = Array.from(players).filter(
      (player) =>
        !games[gameId].players.map((x) => x.address).includes(player.toRawString())
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
  log("==============", "transactions")
};

// export const check_transactions = async () => {
//   await client.connect();
//   const database = client.db("notto");
//   const games = database.collection("games");
//   const allGames = await games.find({}).toArray();
//   let reportString = "";
//   for (const game of allGames) {
//     const res = await checkTransaction(game, database);
//     reportString += `${res} `;
//   }
//   // log(reportString);
// };
