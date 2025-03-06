import { Address, Cell } from "@ton/ton";
import { client } from "../index.js";
import { getTonApi } from "../routes/util/getTonApi.js";

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
    .loadAddress();

  console.log("Winnner Address", winnerAddress);

  const winner = Address.parseFriendly(winnerAddress.toString());
  console.log(`Raw WInner: ${winner.address.toRawString()}`);
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

  archive_games.insertOne({
    ...game,
    endedAt: Date.now(),
    fee,
    winner: winner.toString(),
    transaction: hash,
  });
};
