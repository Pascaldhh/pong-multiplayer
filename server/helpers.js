import { io, CODE_LENGTH, PLAYERS_FOR_GAME, ROOMS } from "./constants.js";
import { ball, map, players, serverLoop } from "./game.js";

function generateCode() {
  return Math.random().toString(36).substring(CODE_LENGTH).toUpperCase();
}

function createRoom(socket) {
  const code = generateCode();

  socket.join(code);
  socket.emit("create-room", code);
  ROOMS[code] = {players: [{id: socket.id, ...players.one}]};
}

function joinRoom(socket, code) {
  code = code.trim();

  let rooms = io.sockets.adapter.rooms;
  if(!rooms.has(code)) { socket.emit("room-error", "Code doesn't exist."); return; }
  if(rooms.get(code).size >= 2) { socket.emit("room-error", "Game is full"); return; }

  socket.join(code);
  socket.emit("join-room", code);
  ROOMS[code].players.push({id: socket.id, ...players.two});

  rooms = io.sockets.adapter.rooms;
  if(rooms.get(code).size == PLAYERS_FOR_GAME) {
    startGame(code);
  }
}

function startGame(code) {
  ROOMS[code].ball = {...ball};
  ROOMS[code].score = {playerOne: 0, playerTwo: 0};
  io.in(code).emit("start-game", {map: map, players: ROOMS[code].players, ball: ROOMS[code].ball, score: ROOMS[code].score});
  serverLoop(code);
}

export {
  generateCode, 
  createRoom, 
  joinRoom
}