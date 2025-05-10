import { Address, beginCell, fromNano, internal, SendMode, TonClient, WalletContractV5R1 } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { sleep } from "../utils/sleep.js";
import { log } from "../utils/log.js";
import { mnemonic } from "../constants/mnemonic.js";
import { g_seqno, tonClient } from "../index.js";

export const end_game = async (address) => {
  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV5R1.create({ publicKey: key.publicKey });

  try {
    log("==============================");

    if (!(await tonClient.isContractDeployed(wallet.address))) {
      return log("wallet is not deployed");
    }

    const balance = await tonClient.getBalance(wallet.address);
    log("BALANCE:");
    log(fromNano(balance));
    const walletContract = tonClient.open(wallet);
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
      g_seqno = currentSeqno;
      walletContract
    }
    log(`END.PAY.BLOCKCHAIN POS - D:${new Date().toTimeString()}`);
  } catch (e) {
    log("END.PAY.BLOCKCHAIN > NEG");
  }
};
