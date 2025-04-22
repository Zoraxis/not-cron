import { MongoClient, ServerApiVersion } from "mongodb";
import express from "express";
import cron from "node-cron";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { TimeoutRouteHandle } from "./util/timeout.js";
import { PayedSocketHandle } from "./socket/game/payed.js";
import { PaySocketHandle } from "./socket/game/pay.js";
import { check_time } from "./lib/check_time.js";
import { check_wallet_disconnect } from "./socket/wallet/check_wallet_disconnect.js";
import { wallet_connected } from "./socket/wallet/wallet_connected.js";
import { gameGetHandler } from "./utils/gameGet.js";
import { check_transactions } from "./lib/transactions.js";
import { stats_page } from "./routes/stats_page.js";
import { admin_page } from "./routes/admin/admin_page.js";
dotenv.config();

const { MONGO_URI } = process.env;

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    allowedHeaders: "*",
  },
});

app.use(cors());
app.use(express.json());

export let games = {};
export let history = [0, 0, 0, 0];
export let connectedUsers = [];
export let walletsToDisconnect = [];

export const client = new MongoClient(MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const setup = async () => {
  for (let i = 1; i <= 4; i++) {
    const game = await gameGetHandler(i);
    game.lastUpdated = Date.now();
    games[i] = game;
  }
  console.log(games);
};

setup();

export const findUserBySocketId = (socketId) =>
  connectedUsers.findIndex((user) => user.id === socketId);

io.on("connection", (socket) => {
  console.log(`SOCKET.U > [${connectedUsers.length}] + 1 | ${socket.id}`);
  connectedUsers.push({ id: socket.id, address: "" });

  socket.on("disconnect", () => {
    console.log(`SOCKET.U > [${connectedUsers.length}] - 1`);
    const index = findUserBySocketId(socket.id);
    if (index === -1) return;
    connectedUsers.splice(index, 1);
  });

  // socket.on("connection.address", ({address, username}) =>
    // wallet_connected(address, username, socket)
  // );

  // socket.on("connection.address.removed", async () => {
  //   console.log("WALLET.DISCONNECTED > ", socket.id);
  //   const index = walletsToDisconnect.findIndex((x) => x.id === socket.id);
  //   walletsToDisconnect.splice(index, 1);
  //   const uindex = findUserBySocketId(socket.id);
  //   connectedUsers[uindex].address = "";
  // });

  // socket.on("game.pay", PaySocketHandle);

  socket.on("game.get", async (gameId) => {
    const game = await games[gameId];
    socket.emit("game", game);
  });

  socket.on("game.fetcher", async (gameId) => {
    socket.emit("game.fetcher", games[gameId]?.lastUpdated);
  });

  socket.on("history.fetcher", async (gameId) => {
    socket.emit("history.fetcher", history[gameId]);
  });

  socket.on("game.payed", PayedSocketHandle);
});

app.listen(3010, () => {
  console.log("server is running on port 3010");
});

server.listen(3011, () => {
  console.log("websocket running at http://localhost:3011");
});

app.get("/", stats_page);
app.get("/admin", admin_page);

app.get("/api/status", (req, res) => {
  res.json({
    connectedUsers,
    games,
    history,
    walletsToDisconnect,
  });
});

app.post("/util/timeout", TimeoutRouteHandle);

cron.schedule(`*/10 * * * * *`, check_time);
cron.schedule("*/1 * * * * *", check_wallet_disconnect);
cron.schedule("*/6 * * * * *", check_transactions);

//3600000
//2592000000
