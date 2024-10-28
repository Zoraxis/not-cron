import { mnemonicToWalletKey } from "@ton/crypto";
import {
  SendMode,
  TonClient,
  WalletContractV5R1,
  fromNano,
  internal,
  beginCell,
} from "@ton/ton";
import { contractAddress, mnemonic } from "./const.js";

async function main() {
  // open wallet v4 (notice the correct wallet version here)
  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV5R1.create({ publicKey: key.publicKey });

  try {
    console.log("init");
    // initialize ton rpc client on testnet
    const client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC", apiKey: "94730209e75a9928c1b0b24b62ed308858d6e9b1b4001b795b2364bdbd752455"
    });

    // make sure wallet is deployed
    if (!(await client.isContractDeployed(wallet.address))) {
      return console.log("wallet is not deployed");
    }

    const balance = await client.getBalance(wallet.address);
    console.log("balance:", fromNano(balance));
    // send 0.05 TON to EQA4V9tF4lY2S_J-sEQR7aUj9IwW-Ou2vJQlCn--2DLOLR5e
    const walletContract = client.open(wallet);
    console.log("opened");
    const seqno = await walletContract.getSeqno();
    console.log("se");

    const payload = beginCell()
      .storeUint(0x87f29cf5, 32)
      .storeUint(0, 64)
      .endCell();
      console.log("cell");

    await walletContract.sendTransfer({
      seqno,
      secretKey: key.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY, // + SendMode.IGNORE_ERRORS,
      messages: [
        internal({
          to: contractAddress,
          value: "0.01", // 0.05 TON
          bounce: true,
          body: payload,
        }),
      ],
    });
    
    console.log("sent");

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
      console.log("waiting for transaction to confirm...");
      await sleep(1500);
      currentSeqno = await walletContract.getSeqno();
    }
    console.log("transaction confirmed!");
  } catch (e) {
    console.log(e);
  }
}

main();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
