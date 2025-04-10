import { io, walletsToDisconnect } from "../../index.js";

export const check_wallet_disconnect = async () => {
  for (const wallet of walletsToDisconnect) {
    console.log("WALLET.DISCONNECTING... > ", wallet.id);
    io.to(wallet.id).emit("wallet.disconnect");
  }
};
