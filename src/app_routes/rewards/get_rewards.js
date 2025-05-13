import { client } from "../../index.js";

export const Rewards = async (req, res) => {
  const address = req.headers["x-user-adress"];
  if (!address) return res.status(400).send({ message: "User not found", status: 400 });

  const db = client.db("notto");
  const collection = db.collection("users");

  const user = await collection.findOne(
    { address },
    { projection: { rewards: 1, rewardsc: 1, _id: 0 } }
  );

  return res.send({
    rewards: user?.rewards,
    rewardsc: user?.rewardsc,
  });
};