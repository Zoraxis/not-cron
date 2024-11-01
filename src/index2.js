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

    console.log(wallet.address)
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
          value: "0.002", // 0.05 TON
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
    console.log("transaction confirmed!");
  } catch (e) {
    console.log("transaction ERROR!");
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
    console.log("==============================");
    console.log("==============================");
    console.log(Date.now());
    const address = "EQCBv-5p3BIfUWXFWNB5t6GpZhTMLayVPzxkTC0Ve-73oL1f"
    end(address);
    try {
      axios.post(`${API_URL}/loto/${4}/end`, {
        secret: ULTRA_MEGA_SUPER_SECRET,
      });
    } catch (error) {
      console.log(error);
    }
  } finally {
    await client.close();
  }
};

checkTime();
// app.listen(3010, () => {
//   console.log("Server is running on port 3010");
// });

// app.get("/", (req, res) => {
//   res.send(`
//       <div>
//         <h1>Notto</h1>
//         <p>Server is running</p>
//       </div>
//     `);
// });

// cron.schedule(`*/${interval} * * * * *`, checkTime);
// //3600000
