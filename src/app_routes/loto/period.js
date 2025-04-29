import { client } from "../../index.js";

export const LotoPeriodHandle = async (req, res) => {
  try {
    const { period } = req.params;

    const db = client.db("notto");

    const games = db.collection("games");

    // Fetch the game
    const game = await games.findOne({
      gameId: parseInt(period),
    });
    if (!game) return res.send({ message: "Game not found", status: 404 });

    // Map user data to players
    const players = game.players.map((player) => {
      return {
        name: hideAddress(player.address),
        date: player.date,
      };
    });

    const uniquePlayers = players.filter(
      (player, index, self) =>
        index === self.findIndex((p) => p.name === player.name)
    );

    const response = {
      ...game,
      players: uniquePlayers,
    };

    return res.send(response);
  } catch (error) {
    console.error(error);
    return res.send({ message: "Internal server error", status: 500 });
  }
};
