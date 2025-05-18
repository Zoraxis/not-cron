import { client } from "../../index.js";
import { hideAddress } from "../../utils/hideAddress.js";

export const ToggleMultisig = async (req, res) => {
  const address = req.headers["x-user-adress"];
  if (!address) return res.send({ message: "User not found", status: 400 });

  const { gameId, operation } = req.body;

  await client.connect();
  const db = client.db("notto");

  const settings = db.collection("settings");

  const admins = (await settings.findOne({ name: "admins" })).value;
  const adminIndex = admins.findIndex((admin) => hideAddress(admin.address) === hideAddress(address));
  if (adminIndex === -1) {
    res.status(403).send("Not an admin");
    return;
  }

  const multisigStateOperations = (
    await settings.findOne({
      name: "multisig-state",
    })
  ).operations;
  let multisigStateOperation = multisigStateOperations[operation];

  if (!multisigStateOperation) {
    res.status(400).send("Invalid operation");
    return;
  }

  const adminValue =
    adminIndex == 0 ? 1 : adminIndex == 1 ? 2 : adminIndex == 2 ? 4 : 8;

  multisigStateOperation[gameId - 1] =
    multisigStateOperation[gameId - 1] ^ (1 << (adminValue - 1));

  if (
    (multisigStateOperation[gameId - 1] &
      (multisigStateOperation[gameId - 1] - 1)) !=
    0
  )
    multisigStateOperation[gameId - 1] = 0;

  const newOperaions = {
    ...multisigStateOperations,
    [operation]: multisigStateOperation,
  };

  await settings.updateOne(
    { name: "multisig-state" },
    { $set: { operations: newOperaions } }
  );
};
