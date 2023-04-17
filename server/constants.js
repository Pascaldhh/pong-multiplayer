import { Server } from "socket.io";

const io = new Server(3000, {
  cors: {
    origin: ["http://localhost:5500", "http://192.168.178.73:5500", "http://127.0.0.1:5500", "http://172.20.10.9:5500"]
  }
});

const ROOMS = [];
const CODE_LENGTH = 7;
const PLAYERS_FOR_GAME = 2;

const FPS = 60;

export {
  CODE_LENGTH,
  PLAYERS_FOR_GAME,
  FPS,
  io,
  ROOMS
}