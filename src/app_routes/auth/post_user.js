import { client } from "../../index.js";
import { claimRewardByUser } from "../../lib/rewards.js";

export const UserPost = async (req, res) => {
  const address = req.headers["x-user-adress"];
  if (!address) return res.send({ message: "User not found", status: 400 });
  
  const referal = req.headers["x-user-referal"];
  
  const { name } = req.body;

  const db = client.db("notto");
  const users = db.collection("users");

  const user = await users.findOne({ address: address });
  if (user)
    return res.send(
      { message: "User already exists", status: 400 }
    );

  await users.insertOne({
    address: address,
    name,
    referal,
    rewards: ["wallet-connect"],
    rewardsc: [],
    notto: 0,
    played: 0,
    won: 0,
    prize: 0,
    spent: 0,
  });

  const createdUser = await users.findOne({ address });
  if (!createdUser)
    return res.send({ message: "User not created", status: 400 });

  if (!!referal) {
    try {
      const referedId = createdUser._id;
      const referalUser = await users.findOneAndUpdate(
        { _id: new ObjectId(referal) },
        {
          $push: {
            refered: referedId,
          },
          $inc: {
            notto: 250,
          },
        }
      );

      if (!!referalUser) {
        [1, 5, 10, 25, 50, 100].forEach((val) => {
          if (referalUser.refered.length == val)
            claimRewardByUser(referalUser, `invite-${val}`);
        });

        await users.updateOne(
          { address },
          {
            $inc: { notto: 250 },
          }
        );
      }
    } catch (e) {
      console.log("Invalid referral ID format");
      referal = null;
    }
  }

  return res.send({ message: "User updated successfully" });
};