import { client } from "../../index.js";

export const GetAdmins = async (req, res) => {
  await client.connect();
  const db = client.db("notto");

  const settings = db.collection("settings");
  const admins = (await settings.findOne({ name: "admins" })).value;

  return res.json(admins);
};
