import { client, games } from "../../index.js";
import { hideAddress } from "../../utils/hideAddress.js";

export const LotoPeriodHandle = async (req, res) => {
  try {
    const { period } = req.params;
    const game = games[period];
    if (!game)
      return res.send({ message: "Game not found", status: 400 });

    const players = game.players.map(player => ({
      name: hideAddress(player.address),
      date: player.date,
    }));

    const { players: _, ...gameData } = game;
    const response = {
      ...gameData,
      players,
    };

    return res.send(response);
  } catch (error) {
    console.error(error);
    return res.send({ message: "Internal server error", status: 500 });
  }
};