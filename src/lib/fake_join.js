import {
  Address,
  beginCell,
  fromNano,
  internal,
  SendMode,
  TonClient,
  WalletContractV5R1,
} from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { sleep } from "../utils/sleep.js";
import { log } from "../utils/log.js";
import { test_wallets } from "../constants/mnemonic.js";
import { games, tonClient } from "../index.js";
import { PayedSocketHandle } from "../socket/game/payed.js";

export const fake_join = async (gameId, walletId) => {
  console.log(test_wallets[walletId]);
  const key = await mnemonicToWalletKey(test_wallets[walletId].split(" "));
  const wallet = WalletContractV5R1.create({ publicKey: key.publicKey });
  if (games[gameId]?.players?.find((x) => x.address == wallet.address)) return;

  try {
    log(wallet.address.toString());
    // if (!(await tonClient.isContractDeployed(wallet.address))) {
    //   return log("wallet is not deployed");
    // }

    const balance = await tonClient.getBalance(wallet.address);
    const walletContract = tonClient.open(wallet);
    const seqno = await walletContract.getSeqno();

    const transferPayload = beginCell()
      .storeUint(0xea2f781e, 32)
      .storeUint(0, 64)
      .endCell();

    await walletContract.sendTransfer({
      seqno,
      secretKey: key.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      messages: [
        internal({
          to: Address.parse(games[gameId].address),
          value: games[gameId].cost.toString(),
          bounce: true,
          body: transferPayload,
        }),
      ],
    });

    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
      await sleep(1500);
      currentSeqno = await walletContract.getSeqno();
      walletContract;
    }
    log("FAKE JOIN > BLOCKCHAIN POS");

    await PayedSocketHandle({
      gameId,
      address: wallet.address.toString(),
    });
    log("FAKE JOIN > POS");
  } catch (e) {
    log(e);
    log("FAKE JOIN > NEG");
  }
};
