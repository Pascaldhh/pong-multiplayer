const socket = io("ws://192.168.178.73:3000");

const screens = {
  "main-menu": document.querySelector("#screen-main-menu"),
  "game": document.querySelector("#screen-game")
}

const buttonIds = [
  {id: "create-room", callback: emitCreateRoom},
  {id: "join-room", callback: emitJoinRoom}
];

function emitCreateRoom() {
  socket.emit("create-room");
}

function emitJoinRoom() {
  const code = document.querySelector("#input-join-room").value;
  socket.emit("join-room", code);
}

function accessRoom(code) {
  screens["main-menu"].classList.add("hide");
  screens["game"].classList.remove("hide");

  const codeContainer = document.querySelector("#game-code");
  codeContainer.textContent = `Game code is ${code}`;
}

function roomError(text) {
  const msgCont = document.querySelector("#error-msg-room");
  msgCont.textContent = text;
}

function startGame(gamedata) {
  window.game = new Game(gamedata);
}

function endGame() {
  window.game.destroy();
  delete window.game;
  screens["game"].classList.add("hide");
  screens["main-menu"].classList.remove("hide");
  const msgCont = document.querySelector("#error-msg-room");
  msgCont.textContent = "Player left - create a new game.";
}

window.addEventListener("click", (e) => {
  buttonIds.forEach(btnData => {
    if(e.target.id == btnData.id) btnData.callback();
  });
});

socket.on("connect", () => {
  socket.on("create-room", accessRoom);
  socket.on("join-room", accessRoom);
  socket.on("room-error", roomError);
  socket.on("start-game", startGame);
  socket.on("player-left", endGame);
})



/**
 * Game
 */

class Canvas {
  constructor() {
    this.canvas = document.querySelector("#pong-game");
    this.ctx = this.canvas.getContext("2d");
  }

  setCanvasSize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.classList.remove("hide");
  }
}

class Player extends Canvas {
  constructor({x, y, width, height, color}) {
    super();
    this.x = x;
    this.y = y;

    this.width = width;
    this.height = height;
    
    this.color = color;
  }

  draw() {
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Ball extends Canvas {
  constructor({x, y, radius, color}) {
    super();
    this.x = x;
    this.y = y;
    
    this.radius = radius;
    this.color = color;
  }

  draw() {
    this.ctx.beginPath()
    this.ctx.fillStyle = this.color;
    this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    this.ctx.fill();
  }
}

class Game extends Canvas {
  constructor(gamedata) {
    super();
    this.hasInited = false;

    this.players = [];
    for(const key in gamedata.players) {
      this.players.push(new Player(gamedata.players[key]));
    }

    this.ball = new Ball(gamedata.ball);
    this.init(gamedata);
    this.gameLoop();
  }

  init(gamedata) {
    this.setCanvasSize(gamedata.map.width, gamedata.map.height);
    this.updateScore(gamedata.score);
    this.listeners();
    this.onSocket();
    this.hasInited = true;
  }

  gameLoop() {
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ball.draw();
    this.players.forEach(player => player.draw());
  }

  updatePlayers(data) {
    this.players.forEach((player, i) => player.y = data[i].y);
  }

  updateBall(ball) {
    this.ball.x = ball.x;
    this.ball.y = ball.y;
  }

  updateScore(score) {
    if(!this.hasInited) {
      const scoreCont = document.querySelector("#screen-game .score-cont");
      scoreCont.style.maxWidth = `${this.canvas.width}px`;
      scoreCont.classList.remove("hide");
    }
    console.log(score);
    document.querySelector("#player-one #score").textContent = score.playerOne;
    document.querySelector("#player-two #score").textContent = score.playerTwo;
  }

  emitPlayerKey(e) {
    const isDown = e.type == "keydown" ? true : false;
    socket.emit("player-key", e.code, isDown)
  }

  listeners() {
    addEventListener("keydown", this.emitPlayerKey);
    addEventListener("keyup", this.emitPlayerKey);
  }

  destroy() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.classList.add("hide");
    document.querySelector("#screen-game .score-cont").classList.add("hide");
    removeEventListener("keydown", this.emitPlayerKey);
    removeEventListener("keyup", this.emitPlayerKey);
  }

  onSocket() {
    socket.on("update-players", (data) => this.updatePlayers(data));
    socket.on("update-ball", (ball) => this.updateBall(ball));
    socket.on("update-score", (score) => this.updateScore(score));
  }

}