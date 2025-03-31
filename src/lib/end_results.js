import { Address, Cell } from "@ton/ton";
import { client, history } from "../index.js";
import { getTonApi } from "../routes/util/getTonApi.js";
import { hideAddress } from "../utils/hideAddress.js";
import { sleep } from "../utils/await.js";

export const end_results = async (game) => {
  const gameRawAddress = Address.parseFriendly(
    game.address
  ).address.toRawString();

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

  const { value: fee } = await settings.findOne({ name: "fee" });

  const { _id, ...gameData } = game;
  let winnerIndexById = -1;

  try {
    winnerIndexById = gameData.players.findIndex(
      (player) =>
        player.id ==
        winnerUser._id
          .toString()
          .replace("new ObjectId('", "")
          .replace("')", "")
    );
  } catch {}

  console.log(winnerAddress, gameData.players. winnerUser);

  let winnerIndexByAddress = -1;
  try {
    winnerIndexByAddress = gameData.players.findIndex(
      (player) => hideAddress(player.address) == hideAddress(winnerAddress)
    );
  } catch {}

  const winnerIndex =
    winnerIndexByAddress !== -1 ? winnerIndexByAddress : winnerIndexById;
  if (winnerIndex === -1) console.log("WINNER.NUMBER > [NOT FOUND]");
  else console.log(`WINNER.NUMBER > ${winnerIndex}`);

  const endetAt = Date.now();

  archive_games.insertOne({
    ...gameData,
    endedAt: endetAt,
    fee,
    winner: winnerAddress,
    winnerNumber: winnerIndex ?? 0,
    transaction: 0,
  });
  history[game.gameId] = Date.now();

  await sleep(1000 * 60 * 1.6);

  let hash = "0";
  try {
    if ((game?.players?.length ?? 0) == 0) return;

    const accData = await getTonApi(`blockchain/accounts/${winnerAddress}`);
    const lastTransLt = accData.last_transaction_lt;

    await sleep(1000 * 1);

    const data = await getTonApi(
      `blockchain/accounts/${winnerAddress}/transactions?after_lt=${
        lastTransLt - 500
      }`
    );
    // for (const transaction of data.transactions) {
    //   console.log(transaction);
    //   if (transaction?.in_msg?.decoded_body?.text) {
    //     console.log(transaction?.in_msg?.decoded_body?.text);
    //   }
    // }

    const outTrasaction = data.transactions.find(
      (transaction) =>
        transaction?.in_msg?.decoded_body?.text &&
        transaction?.in_msg?.decoded_body?.text == "Notto: You won the game!"
    );
    if (!!outTrasaction.hash)
      console.log("WINNER.TRANSACTION >", outTrasaction.hash);
    else console.log("WINNER.TRANSACTION > [NOT FOUND]");
    hash = outTrasaction?.hash ?? "0";

    archive_games.updateOne(
      { address: game.address, endedAt: endetAt },
      { $set: { transaction: hash } }
    );
    history[game.gameId] = Date.now();
  } catch (error) {
    console.log("WINNER.TRANSACTION !ERORR! >", error);
  }
};
