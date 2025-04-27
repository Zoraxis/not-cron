import { log_zones } from "../../index.js";
import { log } from "../../utils/log.js";

export const LogToggleHandle = (req, res) => {
  const { zone } = req.body;
  if (!zone) return res.send("not ok");

  if (log_zones.includes(zone)) {
    log_zones.splice(log_zones.indexOf(zone), 1);
    log(`LOG.TOGGLE > ${zone} log disabled`);
  } else {
    log_zones.push(zone);
    log(`LOG.TOGGLE > ${zone} log enabled`);
  }

  res.send("ok");
};
