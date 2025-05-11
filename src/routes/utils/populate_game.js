import { fake_join } from "../../lib/fake_join";

export const PopulateGame = async (req, res) => {
  const { gameId } = req.params;
  
  await fake_join(gameId, 0);
  await fake_join(gameId, 1);
  await fake_join(gameId, 2);
  await fake_join(gameId, 3);
  await fake_join(gameId, 4);
};
