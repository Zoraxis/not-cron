import { client } from "../../index.js";

export const Rewards = async (req, res) => {
  const address = req.headers["x-user-adress"];
  if (!address) return res.send({ message: "User not found", status: 400 });

  const db = client.db("notto");
  const collection = db.collection("users");

  const user = await collection.findOne({
    address,
  });

  return res.send({
    rewards: user?.rewards,
    rewardsc: user?.rewardsc,
  });
};


fetch("https://notto-cron.win/api/auth", {
  "headers": {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9",
    "access-control-allow-methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
    "access-control-allow-origin": "*",
    "api-key": "",
    "authorization": "0:d4d553f3e5c39b6580cbb35158d655910af5172937b7ad26db83af175e9abe97",
    "cache-control": "no-cache",
    "crossdomain": "true",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\", \"Opera GX\";v=\"117\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "x-user-adress": "0:d4d553f3e5c39b6580cbb35158d655910af5172937b7ad26db83af175e9abe97",
    "Referer": "http://localhost:3000/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": null,
  "method": "GET"
});