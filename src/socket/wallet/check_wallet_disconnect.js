import { io, walletsToDisconnect } from "../../index.js";
import { log } from "../../utils/log.js";

export const check_wallet_disconnect = async () => {
  for (const wallet of walletsToDisconnect) {
    log("WALLET.DISCONNECTING... > ");
    log(wallet.id);
    io.to(wallet.id).emit("wallet.disconnect");
  }
};
