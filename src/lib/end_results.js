import { Address, Cell } from "@ton/ton";
import { client } from "../index.js";
import { getTonApi } from "../routes/util/getTonApi.js";
import { hideAddress } from "../utils/hideAddress.js";

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
      const data = await getTonApi(
        `blockchain/accounts/${winnerAddress}/transactions`
      );

      const outTrasaction = data.transactions.find(
        (transaction) =>
          transaction?.in_msg?.decoded_body?.sender &&
          Address.parseRaw(transaction?.in_msg?.decoded_body?.sender).equals(
            Address.parse(game.address)
          )
      );
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

  const winnerIndex = gameData.players.findIndex(
    (player) => player.address === hideAddress(winnerAddress)
  );

  archive_games.insertOne({
    ...gameData,
    endedAt: Date.now(),
    fee,
    winner: winnerAddress,
    winnerNumber: winnerIndex ?? 0,
    transaction: hash,
  });
};
