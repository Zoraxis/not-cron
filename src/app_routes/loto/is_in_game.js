import { client, games } from "../../index.js";

export const LotoIsInGameHandler = async (req, res) => {
  try {
    const { period } = req.params;
    if (!period) return res.send({ message: "period not found", status: 400 });
    const address = req.headers["x-user-adress"];
    if (!games[period])
      return res.send({ message: "Game not found", status: 400 });
    if (!address) return res.send({ message: "User not found", status: 400 });

    const joined = !!games[period].players.find(
      (player) => player.address == address
    );
    return res.send(joined);
  } catch (error) {
    console.error(error);
    return res.send({ message: "Internal server error", status: 500 });
  }
};
