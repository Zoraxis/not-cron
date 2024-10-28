import { mnemonicToWalletKey } from "@ton/crypto";
import {
  SendMode,
  TonClient,
  WalletContractV5R1,
  fromNano,
  internal,
  beginCell,
  Address,
  Cell,
  JettonMaster,
  toNano,
} from "@ton/ton";

const recipientAddress = "EQAu-K55DDzBwi4Kgx0M26_M5S064DdylXIDZv9D1uBQ767b";
const mnemonic =
  "uphold number uncover grape bread beef result garage boil genuine jeans ocean sleep sign beauty pyramid measure olympic move wage garment bench ripple planet";
const amount = 1;

const jettonMasterAddress = "kQD0GKBM8ZbryVk2aESmzfU6b9b_8era_IkvBSELujFZPsyy"; // USDT
const JETTON_MASTER_ADDRESS = Address.parse(jettonMasterAddress);

async function main() {
  // open wallet v4 (notice the correct wallet version here)
  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV5R1.create({ publicKey: key.publicKey });

  try {
    console.log("init");
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
    console.log("opened");
    const seqno = await walletContract.getSeqno();
    console.log("seq");

    console.log("🚀 ~ main ~ wallet.address:", wallet.address)
    const jettonMaster = client.open(
      JettonMaster.create(JETTON_MASTER_ADDRESS)
    );
    const userJettonAddress = await jettonMaster.getWalletAddress(wallet.address);

    const destinationAddress = Address.parse(recipientAddress);

    const transferPayload = beginCell()
      .storeUint(0xf8a7ea5, 32) // OP code for Jetton transfer
      .storeUint(0, 64) // Query ID
      .storeCoins(BigInt(amount * 1000000)) // Jetton amount
      .storeAddress(destinationAddress) // Recipient address
      .storeAddress(wallet.address) // Response address (optional)
      .storeBit(0) // Indicate we have a custom payload
      .storeCoins(1) // Forward TON amount (for processing fees)
      .storeBit(0) // we store forwardPayload as a reference
      // .storeRef(forwardPayload)
      .endCell();
    console.log("payload");

    await walletContract.sendTransfer({
      seqno,
      secretKey: key.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY, // + SendMode.IGNORE_ERRORS,
      messages: [
        internal({
          to: userJettonAddress,
          value: toNano(0.2), // 0.05 TON
          bounce: true,
          body: transferPayload,
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
