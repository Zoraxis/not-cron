import { games, io } from "../../index.js";

const { ULTRA_MEGA_SUPER_SECRET } = process.env;

export const JoinRouteHandle = (req, res) => {
  const { secret, data } = req.body;
  if (secret !== ULTRA_MEGA_SUPER_SECRET) res.send("not ok");

  const { gameId, address } = data;

  console.log(`user joined game FRFR`, address);
  games[gameId].players.push({
    address,
    timestamp: Date.now(),
  });
  games[gameId].prize += games[gameId].entry;
  games[gameId].lastUpdated = Date.now();
  io.emit("game.joined", { gameId, address });
};
