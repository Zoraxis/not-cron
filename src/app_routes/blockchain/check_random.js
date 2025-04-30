import { client } from "../../index.js";
import { getTonApi } from "../../utils/getTonApi.js";

export const BlockchainCheckRandom = async (req, res) => {
  const { tx } = req.params;

  let data = { error: true };
  while (data.error) {
    data = await getTonApi(`blockchain/transactions/${tx}`);
    if (data.error) {
      await sleep(1000);
    }
  }

  const db = client.db("notto");
  const archive_games = db.collection("archive_games");

  const game = await archive_games.findOne({
    transaction: tx,
  });

  res.send({
    hash: data.hash,
    lt: data.lt,
    block: data.block,
    playersNumber: game.players.length,
    endedAt: game.endedAt,
    random: game.winnerNumber
  });
};
