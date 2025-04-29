import { client } from "../../index.js";
import Cookies from "cookies";

export const UserPost = async (req, res) => {
  let cookies = new Cookies(req, res);

  let address;
  try {
    const { value } = cookies.get("x-user-adress");
    address = value;
  } catch {
    return res.send({ message: "User not found", status: 400 });
  }

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
