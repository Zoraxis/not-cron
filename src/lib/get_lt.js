import { Address, TonClient4 } from "@ton/ton";

export async function getLogicTime(address) {
  const client = new TonClient4({
    endpoint: "https://testnet-v4.tonhubapi.com",
  }); // Use a v4 API endpoint
  const account = await client.getAccountLite(0, Address.parse(address));

  if (!account.account) {
    console.log("Account not found or inactive.");
    return;
  }

  console.log(`LT: ${account.account.lastTransLt}`);
  return account.account.lastTransLt;
}
