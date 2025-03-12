import { Address } from "@ton/ton";

export const hideAddress = (address, num = 7) => {
  try {
    const friendlyAddress = Address.parse(address).toString();
    return `${friendlyAddress.slice(0, num)}...${friendlyAddress.slice(
      num * -1
    )}`;
  } catch {
    return address;
  }
};
