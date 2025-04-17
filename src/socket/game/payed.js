import axios from "axios";
import { client, games } from "../../index.js";
import dotenv from "dotenv";
import { JoinedHandle } from "../../routes/loto/join.js";
import { hideAddress } from "../../utils/hideAddress.js";
import { claimRewardByUser } from "../../lib/rewards.js";
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

  [10, 25, 50, 100].forEach((reward) => {
    if (user.played + 1 === reward) claimRewardByUser(user, `play-any-${reward}`);
  });

  // #region play-all-day
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const otherGamesPlayedToday = [1, 2, 3, 4]
    .filter((id) => id !== game.gameId)
    .every((id) => {
      const lastPlayed = user[`g_${id}_last`];
      return lastPlayed && new Date(lastPlayed).getTime() >= today.getTime();
    });

  if (otherGamesPlayedToday) {
    claimRewardByUser(user, "play-all-day");
    await users.updateOne(
      { address },
      {
        $set: {
          [`g_1_last`]: 0,
          [`g_2_last`]: 0,
          [`g_3_last`]: 0,
          [`g_4_last`]: 0,
        },
      }
    );
  }
  // #endregion

  const payloadReward = `play-${game.gameId}`;
  await users.updateOne(
    { address },
    {
      $inc: {
        spent: game.entry,
        played: 1,
        [`g_${game.gameId}_last`]: Date.now(),
      },
    }
  );
  claimRewardByUser(user, payloadReward);

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
