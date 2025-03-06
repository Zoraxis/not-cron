import { MongoClient, ServerApiVersion } from "mongodb";
import express from "express";
import cron from "node-cron";
import axios from "axios";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { mnemonicToWalletKey } from "@ton/crypto";
import {
  SendMode,
  TonClient,
  WalletContractV5R1,
  fromNano,
  internal,
  beginCell,
  Address,
  TonClient4,
  toNano,
} from "@ton/ton";
import cors from "cors";
import { mnemonic } from "../past/const.js";
import { TimeoutRouteHandle } from "./routes/util/timeout.js";
import { PayedSocketHandle } from "./socket/game/payed.js";
import { PaySocketHandle } from "./socket/game/pay.js";
import { JoinRouteHandle } from "./routes/loto/join.js";
import { end_results } from "./lib/end_results.js";
import { end_server } from "./lib/end_server.js";
dotenv.config();

const {
  MONGO_URI,
  ULTRA_MEGA_SUPER_SECRET,
  API_URL,
  ALLOWED_ORIGIN,
  TONAPI_KEY,
} = process.env;
const TONCENTER_API_URL = "https://testnet.toncenter.com/api/v2/";
const TONAPI_URL = "https://testnet.tonapi.io/v2/";

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

app.use(cors());
app.use(express.json());

export let games = {};

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

export const client = new MongoClient(MONGO_URI, {
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
        const gameClone = games[gameId];
        games[gameId].players = [];
        games[gameId].prize = 0;
        games[gameId].lastUpdated = Date.now();
        if (collection[i]?.players?.length <= 0) continue;
        console.log("==============================");
        console.log("==============================");
        console.log(`Game ${gameId} is ending`);
        console.log(address);
        end(address);
        setTimeout(async () => {
          console.log("send end", gameId, collection[i]?.players?.length);
          io.to(gameId).emit("game.current.ended", gameId);
          end_server(gameId);

          if (collection[i]?.players?.length >= 1) {
            setTimeout(() => {
              end_results(gameClone);
            }, 1000 * 10);
            setTimeout(() => {
              io.emit("game.ended", collection[i]);
            }, 1000 * 20);
          }
          try {
            // const res = await axios.post(`${API_URL}/loto/${gameId}/end`, {
            //   secret: ULTRA_MEGA_SUPER_SECRET,
            // });
            // console.log(`server confirmed ${new Date().toTimeString()}`);
          } catch (error) {
            console.log("server ERROR!");
            console.log(error);
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

async function checkTransaction(game, database) {
  let found = 0;
  let awaiting = 0;
  let errors = 0;
  try {
    const { gameId, address, lastFetchedLt } = game;
    const correctAddress = Address.parseFriendly(address).address.toString();

    const games = database.collection("games");
    const transaction_pool = database.collection("transaction_pool");

    // Get transactions for the contract
    // const txResponse = await axios.get(
    //   `${TONCENTER_API_URL}getTransactions?api_key=${TONCENTER_KEY}&address=${correctAddress}&lt=${
    //     lastFetchedLt ?? 0
    //   }`
    // );
    const txResponse = await axios.get(
      `${TONAPI_URL}blockchain/accounts/${correctAddress}/transactions?after_lt=${
        lastFetchedLt ?? 31650441000000
      }`,
      {
        headers: {
          Authorization: `Bearer ${TONAPI_KEY}`,
        },
      }
    );
    const transactions = txResponse.data.transactions;

    found = transactions.length;
    for (let i = 0; i < transactions.length; i++) {
      // console.log("New transaction detected:", transactions[i]);
      if (i === transactions.length - 1) {
        const { lt } = transactions[i];
        await games.updateOne({ gameId }, { $set: { lastFetchedLt: lt } });
      }

      // TODO: Check if transaction is incoming

      const awaitingTransactions = await transaction_pool
        .find({ gameId })
        .toArray();
      const source = transactions[i].in_msg?.source.address;

      const isAwaiting = awaitingTransactions.find(
        (at) => at.address == source
      );
      if (!isAwaiting) {
        continue;
      }

      awaiting++;
      const { value } = transactions[i].in_msg;
      console.log("Transaction value:", value, toNano(game.entry));
      const isPaid = BigInt(value) >= toNano(game.entry);

      if (!isPaid) continue;

      const res = await axios.post(`${API_URL}/loto/${gameId}/played`, {
        secret: ULTRA_MEGA_SUPER_SECRET,
        address: isAwaiting.address,
      });

      await transaction_pool.deleteOne({
        gameId,
        address: isAwaiting.address,
      });
    }
  } catch (error) {
    errors++;
  }

  return `${found}:${awaiting}${errors > 0 ? `-${errors}` : ""}`;
}

const checkTransactions = async () => {
  await client.connect();
  const database = client.db("notto");
  const games = database.collection("games");
  const allGames = await games.find({}).toArray();
  let reportString = "";
  for (const game of allGames) {
    const res = await checkTransaction(game, database);
    reportString += `${res} `;
  }
  console.log(reportString);
};

const setup = async () => {
  for (let i = 1; i <= 4; i++) {
    const game = await gameGetHandler(i);
    game.lastUpdated = Date.now();
    games[i] = game;
  }
  console.log(games);
};

setup();

io.on("connection", (socket) => {
  socket.join(1);
  socket.emit("time", Date.now());
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("game.pay", PaySocketHandle);

  socket.on("game.get", async (gameId) => {
    const game = await games[gameId];
    socket.emit("game", game);
  });

  socket.on("game.fecher", async (gameId) => {
    socket.emit("game.fecher", games[gameId].lastUpdated);
  });

  socket.on("game.payed", PayedSocketHandle);
});

const syncTime = async () => {
  io.emit("time", Date.now());
};

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

app.post("/loto/join", JoinRouteHandle);
app.post("/util/timeout", TimeoutRouteHandle);

cron.schedule(`*/${interval} * * * * *`, checkTime);
cron.schedule("*/15 * * * * *", syncTime);
cron.schedule("*/5 * * * * *", checkTransactions);

//3600000
//2592000000
