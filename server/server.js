import { createRoom, joinRoom } from "./helpers.js";
import { io } from "./constants.js";
import { keyEvent } from "./game.js";

io.on("connection", socket => {
  socket.on("create-room", () => createRoom(socket));
  socket.on("join-room", (code) => joinRoom(socket, code));
  socket.on("player-key", (key, isDown) => keyEvent(socket, key, isDown));
});