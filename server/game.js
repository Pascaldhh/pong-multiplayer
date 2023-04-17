import { io, FPS, ROOMS } from "./constants.js";

/**
 * Game Objects
 */

const map = {width: 700, height: 500, color: "lightblue"};

const players = {
  one: {x: 20, y: map.height / 2 - 60 / 2, width: 15, height: 60, color: "green", MOVE_DOWN: false, MOVE_UP: false}, 
  two: {x: map.width - 35, y: map.height / 2 - 60 / 2, width: 15, height: 60, color: "red", MOVE_DOWN: false, MOVE_UP: false}, 
};

const ball = {x: map.width / 2, y: map.height / 2, radius: 10, color: "blue"};

const playerSpeed = 4;

let ballSpeedX = 4;
let ballSpeedY = 2;

function keyEvent(socket, key, isDown) {
  const sets = io.sockets.adapter.socketRooms(socket.id);
  sets.delete(socket.id);
  const room = sets.values().next().value;
  const player = ROOMS[room].players.find(player => player.id === socket.id);

  if((key == "KeyW" || key == "ArrowUp") && isDown) player.MOVE_UP = true;
  if((key == "KeyS" || key == "ArrowDown") && isDown) player.MOVE_DOWN = true;

  if((key == "KeyW" || key == "ArrowUp") && !isDown) player.MOVE_UP = false;
  if((key == "KeyS" || key == "ArrowDown") && !isDown) player.MOVE_DOWN = false;
}

function playerLogic(player) {
  if(player.MOVE_UP && player.y > 0) player.y -= playerSpeed;
  if(player.MOVE_DOWN && player.y < map.height - player.height) player.y += playerSpeed;
}

function updatePlayer(code) {
  ROOMS[code].players.forEach(player => playerLogic(player));
  io.in(code).emit("update-players", ROOMS[code].players);
}

function respawnBall(code) {
  ROOMS[code].ball = {...ball};
  ballSpeedX = -4;
  ballSpeedY = 2;
}

function updateBall(code) {
  if(ROOMS[code].ball.x <= 0) {
    ROOMS[code].score.playerOne += 1;
    io.in(code).emit("update-score", ROOMS[code].score);
    respawnBall(code);
  }
  ROOMS[code].players.forEach(player => {
    if(RectCircleColliding(player, ROOMS[code].ball)) {
      ballSpeedX = -ballSpeedX;
      if(ballSpeedX < 0) ballSpeedX += -Math.round(Math.random() * 2);
      if(ballSpeedX > 0) ballSpeedX += Math.round(Math.random() * 2);
      if(ballSpeedY < 0) ballSpeedY += -Math.round(Math.random() * 2);
      if(ballSpeedY > 0) ballSpeedY += Math.round(Math.random() * 2);
    }
  });

  if(ROOMS[code].ball.x >= map.width) {
    ROOMS[code].score.playerTwo += 1;
    io.in(code).emit("update-score", ROOMS[code].score);
    respawnBall(code);
  }

  if(ROOMS[code].ball.y < 0 || ROOMS[code].ball.y > map.height) ballSpeedY = -ballSpeedY;

  ROOMS[code].ball.x += ballSpeedX;
  ROOMS[code].ball.y += ballSpeedY;

  io.in(code).emit("update-ball", ROOMS[code].ball);
}

function RectCircleColliding(rect,circle){
  var dx=Math.abs(circle.x-(rect.x+rect.width/2));
  var dy=Math.abs(circle.y-(rect.y+rect.height/2));

  if( dx > circle.radius+rect.width/2 ){ return(false); }
  if( dy > circle.radius+rect.height/2 ){ return(false); }

  if( dx <= rect.width ){ return(true); }
  if( dy <= rect.height ){ return(true); }

  var dx=dx-rect.width;
  var dy=dy-rect.height
  return(dx*dx+dy*dy<=circle.radius*circle.radius);
}

function checkPlayerLeft(code, loop) {
  let rooms = io.sockets.adapter.rooms;
  if(rooms.has(code) && rooms.get(code).size < 2) { 
    clearInterval(loop);
    io.in(code).emit("player-left");
    delete ROOMS[code];
    io.socketsLeave(code);
  }
}

function serverLoop(code) {
  const gameloop = setInterval(() => {
    updatePlayer(code);
    updateBall(code);
    checkPlayerLeft(code, gameloop);
  }, 1000 / FPS);
}

export {
  map,
  players,
  ball,
  serverLoop,
  keyEvent
}
