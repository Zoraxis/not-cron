const express = require("express");
const app = express();
const cron = require("node-cron");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { default: axios } = require("axios");
require("dotenv").config();

const { MONGO_URI, ULTRA_MEGA_SUPER_SECRET, API_URL } = process.env;

const client = new MongoClient(MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const interval = 10;

const checkTime = async () => {
  try {
    await client.connect();
    await client.db("notto").command({ ping: 1 });

    const database = client.db("notto");
    const collection = await database.collection("games").find({}).toArray();

    const date = Date.now();
    for (let i = 0; i < collection.length; i++) {
      const diff = collection[i].frequency - (date % collection[i].frequency);

      if (diff < interval * 1000) {
        setTimeout(() => {
          try {
            axios.post(`${API_URL}/loto/${collection[i].gameId}/end`, {
              secret: ULTRA_MEGA_SUPER_SECRET,
            });
          } catch (error) {
            console.log(error);
          }
        }, diff - 200);
      }
    }
  } finally {
    await client.close();
  }
};

app.listen(3010, () => {
  console.log("Server is running on port 3000");
});

app.get("/", (req, res) => {
  res.send(`
      <div>
        <h1>Notto</h1>
        <p>Server is running</p>
      </div>
    `);
});

cron.schedule(`*/${interval} * * * * *`, checkTime);
