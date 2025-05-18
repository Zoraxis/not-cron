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
  const adminIndex = admins.findIndex(
    (admin) => hideAddress(admin) === hideAddress(address)
  );
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

  const adminValue = adminIndex + 1;

  const gameIdValue = parseInt(gameId);

  multisigStateOperation[gameIdValue] =
    multisigStateOperation[gameIdValue] ^ (1 << (adminValue - 1));

  if (
    (multisigStateOperation[gameIdValue] &
      (multisigStateOperation[gameIdValue] - 1)) !=
    0
  )
    multisigStateOperation[gameIdValue] = 0;

  const newOperaions = {
    ...multisigStateOperations,
    [operation]: multisigStateOperation,
  };

  await settings.updateOne(
    { name: "multisig-state" },
    { $set: { operations: newOperaions } }
  );

  res.send({
    message: "Operation updated",
    status: 200,
  });
};
