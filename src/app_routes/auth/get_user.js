import { client } from "../../index.js";
import Cookies from 'cookies';

export const User = async (req, res) => {
  let cookies = new Cookies(req, res)

  let address;
  try {
    const { value } = cookies.get("x-user-adress");
    address = value;
  } catch {
    return res.send({ message: "User not found", status: 400 });
  }
  
  const db = client.db("notto");
  const collection = db.collection("users");

  const user = await collection.findOne({
    address,
  });

  return req.send(user);
};