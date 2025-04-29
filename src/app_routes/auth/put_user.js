import { client } from "../../index.js";

export const UserPut = async (req, res) => {
  const address = req.headers["x-user-adress"];
  if (!address) return res.send({ message: "User not found", status: 400 });

  const { name } = req.body;

  const db = client.db("notto");
  const users = db.collection("users");

  await users.updateOne(
    { address },
    {
      $set: {
        name,
      },
    }
  );

  return res.send({ message: "User updated successfully" });
};
