import axios from "axios";

export const TimeoutRouteHandle = (req, res) => {
  const { secret, data } = req.body;
  if (!secret === ULTRA_MEGA_SUPER_SECRET) res.send("not ok");

  const { url, seconds, payload } = data;

  setTimeout(() => {
    axios.post(`${API_URL}/${url}`, {
      ...payload,
      secret: ULTRA_MEGA_SUPER_SECRET,
    });
  }, 1000 * 60 * seconds);
};
