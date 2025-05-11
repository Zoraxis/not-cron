import { test_wallets } from "../../constants/mnemonic.js";
import { fake_join } from "../../lib/fake_join.js";

export const PopulateGame = async (req, res) => {
  const { gameId } = req.params;
  
  for (let i = 0; i < test_wallets.length; i++) {
    await fake_join(gameId, i);
  }
  res.status(200).json({ message: "Game populated" });
};
