import { games } from "../../index.js";
import { end_all } from "../../lib/end_all.js";

export const SimulateEnd = async (req, res) => {
  for (const game of Object.values(games)) {
    end_all(game);
  }

  res.status(200).json({ message: "Simulation started" });
};
