import { MongoClient, ServerApiVersion } from "mongodb";
import express from "express";
import cron from "node-cron";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PayedSocketHandle } from "./socket/game/payed.js";
import { check_time } from "./lib/check_time.js";
import { gameGetHandler } from "./utils/gameGet.js";
import { check_transactions } from "./lib/transactions.js";
import { stats_page } from "./routes/stats_page.js";
import { log } from "./utils/log.js";
import { LogToggleHandle } from "./routes/utils/log_toggle.js";
import { TimeoutRouteHandle } from "./routes/utils/timeout.js";
import { LotoPeriodHandle } from "./app_routes/loto/period.js";
import { LotoIsInGameHandler } from "./app_routes/loto/is_in_game.js";
import { LotoFee } from "./app_routes/loto/fetch_fee.js";
import { Rewards } from "./app_routes/rewards/get_rewards.js";
import { History } from "./app_routes/history/get_history.js";
import { HistoryWinners } from "./app_routes/history/winners.js";
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
export let log_zones = [];
export let coin_rates = {};
export let fee = 0.9;

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
  log(games);
};

setup();

export const findUserBySocketId = (socketId) =>
  connectedUsers.findIndex((user) => user.id === socketId);

io.on("connection", (socket) => {
  log(`SOCKET.U > [${connectedUsers.length}] + 1 | ${socket.id}`);
  connectedUsers.push({ id: socket.id, address: "" });

  socket.on("disconnect", () => {
    log(`SOCKET.U > [${connectedUsers.length}] - 1`);
    const index = findUserBySocketId(socket.id);
    if (index === -1) return;
    connectedUsers.splice(index, 1);
  });

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
  log("server is running on port 3010");
});

server.listen(3011, () => {
  log("websocket running at http://localhost:3011");
});

app.get("/", stats_page);

// #region App Routes
app.get("/loto/:period/period", LotoPeriodHandle);
app.get("/loto/:period/is_in_game", LotoIsInGameHandler);
app.get("/loto/fee", LotoFee);

app.get("/history/:period", History);
app.get("/history/:period/winners", HistoryWinners);

app.get("/rewards", Rewards);

app.get("/:coin/rate", LotoIsInGameHandler);
// #endregion

app.get("/api/status", (req, res) => {
  res.json({
    connectedUsers,
    games,
    history,
    walletsToDisconnect,
  });
});

app.post("/utils/timeout", TimeoutRouteHandle);
app.post("/utils/logs", LogToggleHandle);

cron.schedule(`*/10 * * * * *`, check_time);
cron.schedule("*/6 * * * * *", check_transactions);
cron.schedule("* * */3 * * *", check_transactions);

//3600000
//2592000000
