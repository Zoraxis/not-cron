import axios from "axios";
import { client } from "../../index.js";
import { hideAddress } from "../../utils/hideAddress.js";

export const GetMultisig = async (req, res) => {
  const address = req.headers["x-user-adress"];
  if (!address) return res.send({ message: "User not found", status: 400 });

  await client.connect();
  const db = client.db("notto");

  const settings = db.collection("settings");

  const admins = (await settings.findOne({ name: "admins" })).value;
  const adminIndex = admins.findIndex((admin) => hideAddress(admin) === hideAddress(address));
  if (adminIndex === -1) {
    res.status(403).send("Not an admin");
    return;
  }

  const multisigStateOperations = (
    await settings.findOne({
      name: "multisig-state",
    })
  ).operations;

  return res.json({
    operations: multisigStateOperations,
  });
};
