import { client } from "../index.js";

const calculateUserRewards = async (user, rewardSlug) => {
  await client.connect();
  const db = client.db("notto");

  const users = await db.collection("users");
  const rewards = await db.collection("rewards");

  const reward = await rewards.findOne({ slug: rewardSlug });
  if (!reward) {
    console.log("Reward not found by claiming reward");

    return false;
  }

  const maxLimit = reward?.limit ?? 1;
  const countInRewards = user.rewards.filter(
    (r) => r === rewardSlug
  ).length;
  const countInCollectedRewards = user.rewardsc.filter(
    (r) => r === rewardSlug
  ).length;

  return {
    maxLimit,
    countInRewards,
    countInCollectedRewards,
    users,
    reward,
  };
};

export const claimRewardByUser = async (user, rewardSlug) => {
  const calculatedUserRewards = await calculateUserRewards(user, rewardSlug);
  if (!calculatedUserRewards) {
    return false;
  }

  const { maxLimit, countInRewards, countInCollectedRewards, users } =
    calculatedUserRewards;

  if (countInRewards + countInCollectedRewards < maxLimit * 2) {
    users.updateOne(
      { address: user.address },
      {
        $push: { rewards: rewardSlug },
      }
    );
  }

  return true;
};

export const collectRewardByUser = async (user, rewardSlug) => {
  const calculatedUserRewards = await calculateUserRewards(user, rewardSlug);
  if (!calculatedUserRewards) {
    return false;
  }

  const { countInRewards, users, reward } =
    calculatedUserRewards;

  if (countInRewards > 0) {
    users.updateOne(
      { address: user.address },
      {
        $inc: {
          notto: reward.value,
        },
        $push: { rewardsc: rewardSlug },
        $pull: { rewards: rewardSlug },
      }
    );
  }

  return true;
};
