import { connectedUsers, findUserBySocketId, walletsToDisconnect } from "../../index.js";

export const wallet_connected = async (address, username, socket) => {
  if (!address) return;
  if (walletsToDisconnect.includes(socket.id)) {
    console.log(`WALLET.IGNORED > Socket: ${socket.id} is in disconnect list`);
    return;
  }
  const index = findUserBySocketId(socket.id);
  connectedUsers[index].username = username;

  const sameAddressIndex = connectedUsers.findIndex(
    (user) => user.address === address
  );
  if (sameAddressIndex !== -1) {
    const foundUser = connectedUsers[sameAddressIndex];
    if (foundUser.id !== socket.id) {
      console.log(`WALLET.CONFLICT > Disconnecting socket: ${foundUser}`);
      walletsToDisconnect.push(foundUser);
      connectedUsers[sameAddressIndex].address = "";
    }
  }
  connectedUsers[index].address = address;
  console.log(`WALLET.CONNECTED > S: ${socket.id} A: ${address} U: ${username}`);
};
