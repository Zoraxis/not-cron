import { client } from "../../index.js";
import Cookies from 'cookies';

export const Rewards = async (req, res) => {
  let cookies = new Cookies(req, res)

  let address;
  try {
    const { value } = cookies.get("x-user-adress");
    address = value;
  } catch {
    console.log("empty address");
    return req.send({ message: "User not found", status: 400 });
  }

  const db = client.db("notto");
  const collection = db.collection("users");

  const user = await collection.findOne({
    address,
  });

  return req.send({
    rewards: user?.rewards,
    rewardsc: user?.rewardsc,
  });
};
