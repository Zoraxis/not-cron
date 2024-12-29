import { MongoClient, ServerApiVersion } from "mongodb";
import express from "express";
import cron from "node-cron";
import axios from "axios";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
dotenv.config();

import { mnemonicToWalletKey } from "@ton/crypto";
import {
  SendMode,
  TonClient,
  WalletContractV5R1,
  fromNano,
  internal,
  beginCell,
  Address,
} from "@ton/ton";
import cors from "cors";
import { mnemonic } from "./const.js";

const { MONGO_URI, ULTRA_MEGA_SUPER_SECRET, API_URL, ALLOWED_ORIGIN } =
  process.env;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

async function end(address) {
  // open wallet v4 (notice the correct wallet version here)
  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV5R1.create({ publicKey: key.publicKey });

  try {
    console.log("==============================");
    // initialize ton rpc client on testnet
    const client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
      apiKey:
        "94730209e75a9928c1b0b24b62ed308858d6e9b1b4001b795b2364bdbd752455",
    });

    // make sure wallet is deployed
    if (!(await client.isContractDeployed(wallet.address))) {
      return console.log("wallet is not deployed");
    }

    const balance = await client.getBalance(wallet.address);
    console.log("balance:", fromNano(balance));
    // send 0.05 TON to EQA4V9tF4lY2S_J-sEQR7aUj9IwW-Ou2vJQlCn--2DLOLR5e
    const walletContract = client.open(wallet);
    const seqno = await walletContract.getSeqno();
    const payload = beginCell()
      .storeUint(0x87f29cf5, 32)
      .storeUint(0, 64)
      .endCell();

    await walletContract.sendTransfer({
      seqno,
      secretKey: key.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY, // + SendMode.IGNORE_ERRORS,
      messages: [
        internal({
          to: Address.parse(address),
          value: "0.0035", // 0.05 TON
          bounce: true,
          body: payload,
        }),
      ],
    });

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
      // console.log("waiting for transaction to confirm...");
      await sleep(1500);
      currentSeqno = await walletContract.getSeqno();
    }
    console.log(`blockchain confirmed! - ${new Date().toTimeString()}`);
  } catch (e) {
    console.log("blockchain ERROR!");
    // console.log(e);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
        const { gameId, address } = collection[i];
        console.log("send end", gameId, collection[i]?.players?.length );
        io.to(gameId).emit("game.ended", gameId);
        if (collection[i]?.players?.length <= 0) continue;

        console.log("==============================");
        console.log("==============================");
        console.log(`Game ${gameId} is ending`);
        console.log(address);
        end(address);
        setTimeout(async () => {
          try {
            const res = await axios.post(`${API_URL}/loto/${gameId}/end`, {
              secret: ULTRA_MEGA_SUPER_SECRET,
            });
            console.log(`server confirmed ${new Date().toTimeString()}`);
          } catch {
            console.log("blockchain ERROR!");
          }
        }, diff - 200);
      }
    }
  } finally {
    // await client.close();
  }
};

const gameGetHandler = async (gameId, userId) => {
  await client.connect();
  const database = client.db("notto");
  const games = await database
    .collection("games")
    .find({
      gameId,
    })
    .toArray();
  const game = games[0];
  // await client.close();
  return game;
};

io.on("connection", (socket) => {
  socket.join(1);
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("game.join", async (gameId) => {
    console.log(`user joined game`, gameId);
    const leaveJoin = async () => {
      await socket.leave(1);
      await socket.leave(2);
      await socket.leave(3);
      await socket.leave(4);
      socket.join(gameId);
    };
    leaveJoin();

    // const game = await gameGetHandler(gameId);
    // socket.emit("game", game);
  });

  socket.on("game.get", async (gameId) => {
    const game = await gameGetHandler(gameId);
    socket.emit("game", game);
  });
});

app.listen(3010, () => {
  console.log("server is running on port 3010");
});

server.listen(3011, () => {
  console.log("websocket running at http://localhost:3011");
});

app.get("/", (req, res) => {
  res.send(`
      <div>
        <h1>Notto</h1>
        <p>Server is running</p>
      </div>
    `);
});

app.post("/loto/join", (req, res) => {
  const { secret, data } = req.body;
  if (!secret === ULTRA_MEGA_SUPER_SECRET) res.send("not ok");

  const { gameId, userName } = data;

  console.log(`user joined game FRFR`, userName);
  io.to(gameId).emit("game.joined", userName);
});

cron.schedule(`*/${interval} * * * * *`, checkTime);
//3600000
//2592000000
