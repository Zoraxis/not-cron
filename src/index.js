// const express = require("express");
// const app = express();
// const cron = require("node-cron");
// const { MongoClient, ServerApiVersion } = require("mongodb");
// const { default: axios } = require("axios");
// const { main: end } = require("./end");
// require("dotenv").config();
//rewrite as imports
import { MongoClient, ServerApiVersion } from "mongodb";
import express from "express";
import cron from "node-cron";
import axios from "axios";
import dotenv from "dotenv";
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
import { contractAddress, mnemonic } from "./const.js";

const app = express();

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
        if (collection[i]?.players?.lentgh <= 0) continue;

        console.log("==============================");
        console.log("==============================");
        console.log(`Game ${collection[i].gameId} is ending`);
        console.log(collection[i].address);
        end(collection[i].address);
        // setTimeout(async () => {
        // try {
        // } catch (error) {
        //   console.log(error);
        // }
        // }, 0);//diff - 1500);
        setTimeout(async () => {
          try {
            const res = await axios.post(
              `${API_URL}/loto/${collection[i].gameId}/end`,
              {
                secret: ULTRA_MEGA_SUPER_SECRET,
              }
            );
            console.log(`server confirmed ${new Date().toTimeString()}`);
          } catch {
            console.log("blockchain ERROR!");
          }
        }, diff - 200);
      }
    }
  } finally {
    await client.close();
  }
};

app.listen(3010, () => {
  console.log("Server is running on port 3010");
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
//3600000
//2592000000
