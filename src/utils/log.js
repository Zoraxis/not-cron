import { log_zones } from "../index.js";

export const log = (message, zone) => {
  if (!log_zones.includes(zone) && !!zone) return;

  const date = new Date();
  const formattedDate = date.toISOString().replace("T", " ").split(".")[0];
  const itemsLength = Object.keys(message).length;
  if (itemsLength === 0) console.log(`[${formattedDate}] ${message}`);
  else console.log(`[${formattedDate}] ${JSON.stringify(message).replaceAll(",", ", ")}`);
};
