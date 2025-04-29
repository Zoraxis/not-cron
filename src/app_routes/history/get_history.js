import { client } from "../../index.js";

export const History = async (req, res) => {
  const db = client.db("notto");
  const stats = db.collection("stats");

  const stat = await stats.findOne({ stat: 1 });

  return req.send({
    totalAmount: stat?.prize ?? 0,
    totalPlayers: stat?.players ?? 0,
  });
};