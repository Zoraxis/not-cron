import { Address, Cell } from "@ton/ton";
import { client } from "../index.js";
import { getTonApi } from "../routes/util/getTonApi.js";
import { hideAddress } from "../utils/hideAddress.js";
import { getLogicTime } from "./get_lt.js";

export const end_results = async (game) => {
  await client.connect();
  const db = client.db("notto");

  const users = await db.collection("users");
  const settings = await db.collection("settings");
  const archive_games = await db.collection("archive_games");

  const res = await getTonApi(
    `blockchain/accounts/${game.address}/methods/get_last_winner`
  );
  const slice = res.stack;
  const winnerAddress = Cell.fromBoc(Buffer.from(slice[0].cell, "hex"))[0]
    .beginParse()
    .loadAddress()
    .toString();

  const winner = Address.parseFriendly(winnerAddress);
  const winnerUser = await users.findOne({
    address: winner.address.toRawString(),
  });

  let hash = "0";
  try {
    if ((game?.players?.length ?? 0) != 0) {
      const accData = await getTonApi(
        `blockchain/accounts/${winnerAddress}`
      );
      const lastTransLt = accData.last_transaction_lt
      const data = await getTonApi(
        `blockchain/accounts/${winnerAddress}/transactions?after_lt=${lastTransLt - 10}`
      );
      for (const transaction of data.transactions) {
        if (transaction?.in_msg?.decoded_body?.text) {
          console.log(transaction?.in_msg?.decoded_body?.text);
        }
      }

      const gameRawAddress = Address.parseFriendly(
        game.address
      ).address.toRawString();

      const outTrasaction = data.transactions.find(
        (transaction) =>
          transaction?.in_msg?.decoded_body?.text &&
          transaction?.in_msg?.decoded_body?.text == "Notto: Your won the game!"
      );
      console.log(outTrasaction);
      hash = outTrasaction?.hash ?? "0";
    }
  } catch (error) {
    console.log("Error while getting win transaction", error);
  }

  const { value: fee } = await settings.findOne({ name: "fee" });

  const { _id, ...gameData } = game;

  console.log(
    `res ${gameData.players.length} ${gameData.prize} ${gameData.gameId} ${winnerAddress}`
  );

  console.log(winnerUser);
  console.log(hideAddress(winnerAddress));
  console.log(gameData.players);

  let winnerIndexById = -1;
  try {
    console.log(
      winnerUser._id.toString().replace("new ObjectId('", "").replace("')", "")
    );
    winnerIndexById = gameData.players.findIndex(
      (player) =>
        player.id ==
        winnerUser._id
          .toString()
          .replace("new ObjectId('", "")
          .replace("')", "")
    );
  } catch {}

  let winnerIndexByAddress = -1;
  try {
    winnerIndexByAddress = gameData.players.findIndex(
      (player) => player.address == hideAddress(winnerAddress)
    );
  } catch {}

  const winnerIndex =
    winnerIndexByAddress !== -1 ? winnerIndexByAddress : winnerIndexById;

  archive_games.insertOne({
    ...gameData,
    endedAt: Date.now(),
    fee,
    winner: winnerAddress,
    winnerNumber: winnerIndex ?? 0,
    transaction: hash,
  });
};
