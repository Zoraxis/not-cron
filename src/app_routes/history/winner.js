import { ObjectId } from "mongodb";
import { client } from "../../index.js";
import { hideAddress } from "../../utils/hideAddress.js";

export const HistoryWinner = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send([]);

    const db = client.db("notto");
    const archive = db.collection("archive_games");

    const winnersRaw = await archive.findOne(
      { _id: ObjectId(id) },
      { projection: { players: 1 } }
    );

    if (!winnersRaw?.players) return res.send([]);

    const result = winnersRaw.players.map((player) => ({
      name: hideAddress(player.address),
      date: player.date,
    }));

    return res.send(result);
  } catch (err) {
    console.error(err);
    return res.status(500).send([]);
  }
};
