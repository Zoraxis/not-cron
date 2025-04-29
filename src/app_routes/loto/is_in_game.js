import { client } from "../../index.js";
import Cookies from 'cookies';

export const LotoIsInGameHandler = async (req, res) => {
  try {
    const { period } = req.params;
    let cookies = new Cookies(req, res)

    let address;
    try {
      const { value } = cookies.get("x-user-adress");
      address = value;
    } catch {
      return res.send({ message: "User not found", status: 400 });
    }

    if (!address) return res.send({ message: "User not found", status: 400 });

    const db = client.db("notto");

    const users = db.collection("users");

    const user = await users.findOne({
      address: address,
    });
    if (!user) return res.send({ message: "User not found", status: 400 });

    const games = await db.collection("games");

    const game = await games.findOne({
      gameId: parseInt(period),
    });

    if (!game) return res.send({ message: "Game not found", status: 400 });

    const joined = !!game.players.find(
      (player) => player.id.toString() == user._id
    );
    return res.send(joined);
  } catch (error) {
    console.error(error);
    return res.send({ message: "Internal server error", status: 500 });
  }
};
