import { io } from "socket.io-client";

const socket = io("http://localhost:3011", {
  path: "/game",
});

socket.on("connect", () => {
  console.log("Connected to WebSocket server");
});

socket.on("game.ended", (data) => {
  console.log("Game ended:", data);
});

socket.on("disconnect", () => {
  console.log("Disconnected from WebSocket server");
});
