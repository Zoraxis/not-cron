import axios from "axios";
import { client } from "../../index.js";
import dotenv from "dotenv";
import { JoinedHandle } from "../../routes/loto/join.js";
dotenv.config();

export const PayedSocketHandle = async ({ gameId, address, boc }) => {
  console.log(`user payed game`, gameId, address);
  await client.connect();
  const database = client.db("notto");
  const games = database.collection("games");
  const transaction_pool = database.collection("transaction_pool");
  const users = database.collection("users");

  await transaction_pool.deleteOne({
    gameId,
    address,
  });

  const user = await users.findOne({
    address,
  });
  if (!user) return;

  const game = await games.findOne({
    gameId: parseInt(gameId),
  });
  if (!game) return;

  const joined = !!game.players.find(
    (player) => player.id.toString() == user._id
  );
  if (!!joined) return;

  JoinedHandle({ gameId, address });

  const player = {
    id: user._id,
    date: Date.now(),
  };

  const payloadReward = `play-${game.gameId}`;
  await users.updateOne(
    { address },
    {
      $inc: {
        played: 1,
        spent: game.entry,
      },
      $push: {
        rewards: payloadReward,
      },
    }
  );

  const result = await games.updateOne(
    { gameId: parseInt(gameId) },
    {
      $push: {
        players: player,
      },
      $inc: { prize: game.entry },
    }
  );

  if (result.modifiedCount === 1) {
    console.log("User added to game");
  } else {
    console.log("User not added to game");
  }
};
