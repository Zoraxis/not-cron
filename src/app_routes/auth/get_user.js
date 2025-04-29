import { client } from "../../index.js";
import Cookies from "cookies";

export const User = async (req, res) => {
  const cookies = new Cookies(req, res);

  const address = cookies.get("x-user-adress");
  if (!address) return res.send({ message: "User not found", status: 400 });

  const db = client.db("notto");
  const collection = db.collection("users");

  const user = await collection.findOne({
    address,
  });

  return req.send(user);
};
