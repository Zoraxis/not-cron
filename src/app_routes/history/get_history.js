import { stats } from "../../index.js";

export const History = async (req, res) => {
  return res.send(stats);
};