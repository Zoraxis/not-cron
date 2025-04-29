import { coin_rates } from "..";

export const fetch_rates = async () => {
    const { data: tonData } = await axios.get(
      `https://tonapi.io/v2/rates?tokens=ton&currencies=usdt`
    );

    coin_rates["ton"] = tonData?.rates?.TON?.prices?.USDT ?? 5;
}