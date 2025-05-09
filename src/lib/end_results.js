import { Address, Cell } from "@ton/ton";
import { client, history, tonClient } from "../index.js";
import { hideAddress } from "../utils/hideAddress.js";
import { sleep } from "../utils/sleep.js";
import { claimRewardByUser } from "./rewards.js";
import { log } from "../utils/log.js";

export const getWinnerId = async (game) => {
  const data = await tonClient.runMethod(game.address, "get_last_winner", []);
  log(data);
  log(data?.stack[0]);
  if (data.error) {
    log("WINNER.ERROR >");
    log(res.error);
    return { id: -1, address: "0" };
  }
  const winnerAddress = Cell.fromBoc(Buffer.from(data?.stack[0].cell, "hex"))[0]
    .beginParse()
    .loadAddress()
    .toString();
  log(winnerAddress);

  await client.connect();
  const db = client.db("notto");

  const users = await db.collection("users");

  const winner = Address.parseFriendly(winnerAddress);
  const winnerUser = await users.findOne({
    address: winner.address.toRawString(),
  });

  if (!winnerUser) {
    log("WINNER.USER > [NOT FOUND]");
    return { id: -1, address: "0" };
  }

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

  log(winner.address.toRawString());
  log(gameData.players);
  log(winnerUser);

  let winnerIndexByAddress = -1;
  try {
    winnerIndexByAddress = gameData.players.findIndex(
      (player) => hideAddress(player.address) == hideAddress(winnerAddress)
    );
  } catch {}

  const winnerIndex =
    winnerIndexByAddress !== -1 ? winnerIndexByAddress : winnerIndexById;
  if (winnerIndex === -1) log("WINNER.NUMBER > [NOT FOUND]");
  else {
    log(`WINNER.NUMBER > ${winnerIndex}`);

    claimRewardByUser(winnerUser, `win-1`);
  }

  return { id: winnerIndex, address: winnerAddress };
};

export const getTransactionHash = async (game, winnerAddress) => {
  let hash = "0";
  try {
    if ((game?.players?.length ?? 0) == 0) return;

    const accData = await tonClient.getAccount(winnerAddress);
    const lastTransLt = accData.last_transaction_lt;

    await sleep(1000 * 1);

    const data = await tonClient.getTransactions(winnerAddress, {
      lt: lastTransLt - 500,
    });
    log(data);

    if (data.error) {
      log("WINNER.ERROR >");
      log(res.error);
      return "0";
    }
    // for (const transaction of data.transactions) {
    //   log(transaction);
    //   if (transaction?.in_msg?.decoded_body?.text) {
    //     log(transaction?.in_msg?.decoded_body?.text);
    //   }
    // }

    const outTrasaction = data.transactions.find(
      (transaction) =>
        transaction?.in_msg?.decoded_body?.text &&
        transaction?.in_msg?.decoded_body?.text == "Notto: You won the game!"
    );
    log(outTrasaction);
    if (!!outTrasaction?.hash) log("WINNER.TRANSACTION >", outTrasaction.hash);
    else log("WINNER.TRANSACTION > [NOT FOUND]");
    hash = outTrasaction?.hash ?? "0";
    return hash;
  } catch (error) {
    log("WINNER.TRANSACTION !ERORR! >");
    log(error);
    return "0";
  }
};

export const end_results = async (game) => {
  const endetAt = Date.now() - 9000;

  await client.connect();
  const db = client.db("notto");

  const settings = db.collection("settings");
  const archive_games = db.collection("archive_games");

  const { _id, ...gameData } = game;

  let winnerRes = await getWinnerId(game);
  while (winnerRes.id == -1) {
    log("WAITING FOR WINNER...");
    await sleep(1000 * 5);
    winnerRes = await getWinnerId(game);
  }

  const { value: fee } = await settings.findOne({ name: "fee" });

  archive_games.insertOne({
    ...gameData,
    endedAt: endetAt,
    fee,
    winner: winnerRes.address,
    winnerNumber: winnerRes.id ?? 0,
    transaction: 0,
  });
  history[game.gameId] = Date.now();

  await sleep(1000 * 60 * 1.6);

  let hash = await getTransactionHash(game, winnerRes.address);
  while (hash == "0") {
    log("WAITING FOR TRANSACTION...");
    await sleep(1000 * 5);
    hash = await getTransactionHash(game, winnerRes.address);
  }

  archive_games.updateOne(
    { address: game.address, endedAt: endetAt },
    { $set: { transaction: hash } }
  );
  history[game.gameId] = Date.now();
};
