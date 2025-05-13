import { client } from "../../index.js";

export const HistoryWinners = async (req, res) => {
  try {
    const { period } = req.params;

    const db = client.db("notto");
    const archive = db.collection("archive_games");

    const winnersRaw = await archive
      .find(
        {
          gameId: parseInt(period, 10),
          prize: { $ne: 0 },
          players: { $not: { $size: 1 } },
        },
        {
          projection: {
            prize: 1,
            fee: 1,
            winner: 1,
            transaction: 1,
            _id: 1,
            winnerNumber: 1,
            endedAt: 1,
            coin: 1,
          },
        }
      )
      .sort({ endedAt: -1 })
      .limit(10)
      .toArray();

    const winners = winnersRaw.map((winnerRaw) => ({
      prize: winnerRaw.prize * winnerRaw.fee,
      address: winnerRaw.winner,
      transaction: winnerRaw.transaction ?? "N/A",
      id: winnerRaw._id,
      winnerNumber: winnerRaw.winnerNumber,
      date: winnerRaw.endedAt,
      currency: winnerRaw.coin,
    }));

    return res.send(winners);
  } catch (err) {
    console.error(err);
    return res.status(500).send([]);
  }
};