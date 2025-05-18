import { client } from "../../index.js";

export const GetAdmins = async (req, res) => {
  const address = req.headers["x-user-adress"];
  if (!address) return res.send({ message: "User not found", status: 400 });

  await client.connect();
  const db = client.db("notto");

  const settings = db.collection("settings");
  const admins = (await settings.findOne({ name: "admins" })).value;

  return res.json(admins);
};
