import { coin_rates } from "../..";

export const LotoIsInGameHandler = async (req, res) => {
  const { coin } = req.params;

  res.send(coin_rates[coin]);
};
