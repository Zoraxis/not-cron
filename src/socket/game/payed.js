import axios from "axios";
import { client, games } from "../../index.js";
import dotenv from "dotenv";
import { JoinedHandle } from "../../routes/loto/join.js";
import { hideAddress } from "../../utils/hideAddress.js";
dotenv.config();

export const PayedSocketHandle = async ({ gameId, address, boc }) => {
  await client.connect();
  const database = client.db("notto");
  const gamesCollection = database.collection("games");
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

  const game = await gamesCollection.findOne({
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

  const result = await gamesCollection.updateOne(
    { gameId: parseInt(gameId) },
    {
      $push: {
        players: player,
      },
      $inc: { prize: game.entry },
    }
  );

  if (result.modifiedCount === 1) {
    console.log("GAME.JOIN > POS");
  } else {
    console.log("GAME.JOIN > NEG");
  }
};
