import { client } from "../../index.js";

export const LotoIsInGameHandler = async (req, res) => {
  try {
    const { period } = params.params;
    const cookieStore = cookies();

    let address;
    try {
      const { value } = cookieStore.get("x-user-adress");
      address = value;
    } catch {
      console.log("empty address");
      return req.send({ message: "User not found", status: 400 });
    }

    if (!address) return req.send({ message: "User not found", status: 400 });

    const db = client.db("notto");

    const users = db.collection("users");

    const user = await users.findOne({
      address: address,
    });
    if (!user) return req.send({ message: "User not found", status: 400 });

    const games = await db.collection("games");

    const game = await games.findOne({
      gameId: parseInt(period),
    });

    if (!game) return req.send({ message: "Game not found", status: 400 });

    const joined = !!game.players.find(
      (player) => player.id.toString() == user._id
    );
    return req.send(joined);
  } catch (error) {
    console.error(error);
    return req.send({ message: "Internal server error", status: 500 });
  }
};
