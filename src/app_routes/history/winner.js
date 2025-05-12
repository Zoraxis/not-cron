import { client } from "../../index.js";

export const HistoryWinner = async (req, res) => {
  const { id } = req.params;

  const db = client.db("notto");
  const archive = db.collection("archive_games");

  const winnersRaw = await archive
    .findOne({
      _id: new ObjectId(id),
    })
    .limit(1);

  const winners = (await winnersRaw.toArray());
  return res.send(winners);
};
