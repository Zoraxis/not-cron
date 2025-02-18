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
} from "@ton/ton";
import cors from "cors";
import { mnemonic } from "./const.js";
import WebSocket from "ws";
dotenv.config();

const { MONGO_URI, ULTRA_MEGA_SUPER_SECRET, API_URL, ALLOWED_ORIGIN } =
  process.env;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
        if (collection[i]?.players?.length <= 0) continue;
        console.log("==============================");
        console.log("==============================");
        console.log(`Game ${gameId} is ending`);
        console.log(address);
        end(address);
        setTimeout(async () => {
          console.log("send end", gameId, collection[i]?.players?.length);
          io.to(gameId).emit("game.current.ended", gameId);

          if (collection[i]?.players?.length >= 1) {
            setTimeout(() => {
              io.emit("game.ended", collection[i]);
            }, 1000 * 14);
          }
          try {
            const res = await axios.post(`${API_URL}/loto/${gameId}/end`, {
              secret: ULTRA_MEGA_SUPER_SECRET,
            });
            console.log(`server confirmed ${new Date().toTimeString()}`);
          } catch (error) {
            console.log("blockchain ERROR!");
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

const transactionListener = async (address) => {
  const TONAPI_WS_URL = "wss://testnet.tonapi.io/v2/websocket";

  console.log("Connecting to TONAPI WebSocket...");

  // WebSocket-Verbindung herstellen
  const ws = new WebSocket(TONAPI_WS_URL);

  ws.on("open", () => {
    console.log("WebSocket verbunden, Abonnement wird gesendet...");

    // Abonnement für Konto-Updates (inkl. Transaktionen)
    const subscriptionMessage = {
      jsonrpc: "2.0",
      id: 1,
      method: "subscribe_account",
      params: [address],
    };

    ws.send(JSON.stringify(subscriptionMessage));
  });

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data);
      console.log("Eingehende Nachricht:", message);

      if (message.result) {
        console.log("📩 Transaktions-Update:", message.result);
      }
    } catch (error) {
      console.error("Fehler beim Verarbeiten der Nachricht:", error);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket-Fehler:", error);
  });

  ws.on("close", () => {
    console.log("WebSocket-Verbindung geschlossen");
  });
};
transactionListener(
  Address.parseFriendly(
    "EQAUq6WgTjbXTPVwKa9dz1SKdbKLX3TZxHbl4yk0eP1zrxHm"
  ).address.toRawString()
);

io.on("connection", (socket) => {
  socket.join(1);
  socket.emit("time", Date.now());
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

  socket.on("game.pay", async ({ gameId, address }) => {
    console.log(address);
    transactionListener(address);
  });

  socket.on("game.get", async (gameId) => {
    const game = await gameGetHandler(gameId);
    socket.emit("game", game);
  });
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

app.post("/loto/join", (req, res) => {
  const { secret, data } = req.body;
  if (!secret === ULTRA_MEGA_SUPER_SECRET) res.send("not ok");

  const { gameId, userName } = data;

  console.log(`user joined game FRFR`, userName);
  io.to(gameId).emit("game.joined", userName);
});

app.post("/transactions", (req, res) => {
  console.log("transactions");
  console.log(req.body);
});

cron.schedule(`*/${interval} * * * * *`, checkTime);
cron.schedule("*/15 * * * * *", syncTime);

//3600000
//2592000000
