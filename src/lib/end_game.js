import { Address, beginCell, fromNano, internal, SendMode, TonClient, WalletContractV5R1 } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { sleep } from "../utils/sleep.js";
import { log } from "../utils/log.js";
import { mnemonic } from "../constants/mnemonic.js";

export const end_game = async (address) => {
  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV5R1.create({ publicKey: key.publicKey });

  try {
    log("==============================");
    const client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
      apiKey:
        "94730209e75a9928c1b0b24b62ed308858d6e9b1b4001b795b2364bdbd752455",
    });

    if (!(await client.isContractDeployed(wallet.address))) {
      return log("wallet is not deployed");
    }

    const balance = await client.getBalance(wallet.address);
    log("BALANCE:");
    log(fromNano(balance));
    const walletContract = client.open(wallet);
    const seqno = await walletContract.getSeqno();
    const payload = beginCell()
      .storeUint(0x87f29cf5, 32)
      .storeUint(0, 64)
      .endCell();

    await walletContract.sendTransfer({
      seqno,
      secretKey: key.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      messages: [
        internal({
          to: Address.parse(address),
          value: "0.0035",
          bounce: true,
          body: payload,
        }),
      ],
    });

    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
      await sleep(1500);
      currentSeqno = await walletContract.getSeqno();
    }
    log(`END.PAY.BLOCKCHAIN POS - D:${new Date().toTimeString()}`);
  } catch (e) {
    log("END.PAY.BLOCKCHAIN > NEG");
  }
};
