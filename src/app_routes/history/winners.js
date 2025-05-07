import { client } from "../../index.js";

export const HistoryWinners = async (req, res) => {
  const { period } = req.params;

  const db = client.db("notto");
  const archive = db.collection("archive_games");

  const winnersRaw = await archive
    .find({
      gameId: parseInt(period.toString()),
      prize: { $not: { $eq: 0 } },
      players: { $not: { $size: 1 } },
    })
    .sort({ endedAt: "desc" })
    .limit(10);

  const winners = (await winnersRaw.toArray()).map((winnerRaw) => ({
    prize: winnerRaw.prize * winnerRaw.fee,
    address: winnerRaw?.winner,
    transaction: winnerRaw?.transaction ?? "N/A",
    id: winnerRaw?._id.id,
    winnerNumber: winnerRaw?.winnerNumber,
    date: winnerRaw.endedAt,
    currency: winnerRaw.coin,
  }));
  return res.send(winners);
};
