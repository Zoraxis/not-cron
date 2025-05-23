import { client } from "../index.js";

export const end_server = async (period) => {
  await client.connect();
  const db = client.db("notto");

  const games = await db.collection("games");
  const stats = await db.collection("stats");

  const game = await games.findOne({ gameId: parseInt(period) });

  const { _id, ...gameData } = game;

  if (gameData?.players?.length >= 2) {
    await stats.updateOne(
      { stat: 1 },
      {
        $inc: {
          players: game?.players?.length ?? 0,
          prize: (game?.prize ?? 0) * 0.9,
        },
      }
    );

    stats.totalAmount += (game?.prize ?? 0) * 0.9;
    stats.totalPlayers += game?.players?.length ?? 0;
  }

  await games.updateOne(
    { gameId: parseInt(period) },
    {
      $set: {
        players: [],
        prize: 0,
        endedAt: Date.now(),
      },
    }
  );
};
