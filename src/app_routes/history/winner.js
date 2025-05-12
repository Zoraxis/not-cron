import { ObjectId } from "mongodb";
import { client } from "../../index.js";
import { hideAddress } from "../../utils/hideAddress.js";

export const HistoryWinner = async (req, res) => {
  const { id } = req.query;

  const db = client.db("notto");
  const archive = db.collection("archive_games");

  const winnersRaw = await archive.findOne({
    _id: new ObjectId(id),
  });
  console.log(winnersRaw);

  return res.send(
    winnersRaw?.players?.map((player) => ({
      name: hideAddress(player.address),
      date: player.date,
    })) ?? []
  );
};
