import { coin_rates } from "../..";

export const BlockchainCoinRate = async (req, res) => {
  const { coin } = req.params;

  res.send(coin_rates[coin]);
};
