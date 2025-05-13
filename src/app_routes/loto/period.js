import { client, games } from "../../index.js";
import { hideAddress } from "../../utils/hideAddress.js";

export const LotoPeriodHandle = async (req, res) => {
  try {
    const { period } = req.params;
    if (!games[period])
      return res.send({ message: "Game not found", status: 400 });

    // const db = client.db("notto");

    // const games = db.collection("games");

    // // Fetch the game
    // const game = await games.findOne({
    //   gameId: parseInt(period),
    // });
    // if (!game) return res.send({ message: "Game not found", status: 404 });

    // Map user data to players
    const players = games[period].players.map((player) => {
      return {
        name: hideAddress(player.address),
        date: player.date,
      };
    });

    // const uniquePlayers = players.filter(
    //   (player, index, self) =>
    //     index === self.findIndex((p) => p.name === player.name)
    // );

    const response = {
      ...games[period],
      players,
    };

    return res.send(response);
  } catch (error) {
    console.error(error);
    return res.send({ message: "Internal server error", status: 500 });
  }
};
