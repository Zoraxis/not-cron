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

const client = new MongoClient(MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  await client.connect();
  await client.db("notto").command({ ping: 1 });

  const database = client.db("notto");
  const archive_games = await database.collection("archive_games");
  await archive_games.deleteMany({
    coin: "NOT",
  });
  console.log("DELTETED");
};
run();
