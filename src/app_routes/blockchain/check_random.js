import { ObjectId } from "mongodb";
import { client } from "../../index.js";

export const BlockchainCheckRandom = async (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(400).send({ message: "Missing id", status: 400 });

  const db = client.db("notto");
  const archive_games = db.collection("archive_games");

  const game = await archive_games.findOne(
    { _id: ObjectId.createFromHexString(id) },
    {
      projection: {
        transaction: 1,
        cur_lt: 1,
        block_lt: 1,
        now: 1,
        prize: 1,
        players: 1,
        endedAt: 1,
        winner: 1,
        winnerNumber: 1,
      },
    }
  );

  if (!game) return res.send({ message: "Game not found", status: 400 });

  res.send({
    hash: game?.transaction ?? 999000999,
    cur_lt: game?.cur_lt ?? 999000999,
    block_lt: game?.block_lt ?? 999000999,
    now: game?.now ?? 999000999,
    prize: game.prize,
    players: game.players,
    endedAt: game.endedAt,
    wallet: game.winner,
    random: game.winnerNumber,
  });
};