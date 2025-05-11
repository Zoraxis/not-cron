import { Address } from "@ton/ton";
import { admin_address, client, games, history, tonClient } from "../index.js";
import { hideAddress } from "../utils/hideAddress.js";
import { sleep } from "../utils/sleep.js";
import { claimRewardByUser } from "./rewards.js";
import { log } from "../utils/log.js";
import { getTonApi } from "../utils/getTonApi.js";
import { getTonCenter } from "../utils/getTonCenter.js";

export const getWinnerId = async (game) => {
  const data = await tonClient.runMethod(game.address, "get_last_winner", []);
  if (data.error) {
    log("WINNER.ERROR >");
    log(res.error);
    return { id: -1, address: "0" };
  }
  const winnerAddress = data.stack.readAddress().toString();
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
  try {
    if ((game?.players?.length ?? 0) == 0) return;

    let lastTransLt = game.last_lt ?? 0;
    if (lastTransLt == 0) {
      const accData = await getTonApi(`blockchain/accounts/${admin_address}`);
      lastTransLt = accData.last_transaction_lt - 400;
    }

    await sleep(1000 * 1);

    const data = (
      await tonClient.getTransactions(admin_address, {
        lt: lastTransLt + 100,
        limit: 1,
      })
    )[0];
    games[game.gameId].last_lt = data.lt;
    log(data);

    const outMessage = data.outMessages.values()[0];
    const realLt = parseInt(data.lt.toString());
    const realAddress = outMessage.info.dest;

    const outTrasaction = (
      await tonClient.getTransactions(realAddress, {
        lt: realLt,
        limit: 1,
      })
    )[0];
    log(outTrasaction);
    const hash = outTrasaction.hash().toString("hex");
    const { lt: cur_lt, now } = outTrasaction;

    // TESTNET
    const block = (
      await getTonCenter(
        `blocks?worckchain=-1&start_utime=${outTrasaction.now}&limit=1&start_lt=${outTrasaction.prevTransactionLt}&end_lt=${outTrasaction.lt}`
      )
    )[0];
    const block_lt = block?.start_lt

    log(cur_lt);
    log(block_lt);
    log(now);

    if (!!outTrasaction) log("WINNER.TRANSACTION >", outTrasaction.hash);
    else log("WINNER.TRANSACTION > [NOT FOUND]");
    return { hash, cur_lt, block_lt, now };
  } catch (error) {
    log("WINNER.TRANSACTION !ERORR! >");
    console.log(error);
    return { hash: "0" };
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

  await sleep(1000 * 5);

  let transaction = await getTransactionHash(game, winnerRes.address);
  while (transaction?.hash == "0") {
    log("WAITING FOR TRANSACTION...");
    await sleep(1000 * 5);
    transaction = await getTransactionHash(game, winnerRes.address);
  }

  const { hash, cur_lt, block_lt, now } = transaction;

  archive_games.updateOne(
    { address: game.address, endedAt: endetAt },
    { $set: { transaction: hash, cur_lt, block_lt, now } }
  );
  history[game.gameId] = Date.now();
};
