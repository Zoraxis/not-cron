import { client } from "../../index.js";

export const GetMultisigAddress = async (req, res) => {
  const address = req.headers["x-user-adress"];
  if (!address) return res.send({ message: "User not found", status: 400 });

  await client.connect();
  const db = client.db("notto");

  const settings = db.collection("settings");
  const multisigAddress = (await settings.findOne({ name: "multisig" })).value;

  return res.json(multisigAddress);
};
