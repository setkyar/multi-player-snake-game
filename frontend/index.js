const BG_COLOUR = "#231f20";
const SNAKE_COLOR = "#c2c2c2";
const FOOD_COLOR = "#e66916";

const socket = io("https://snake-socket.setkyar.com");

socket.on("init", handleInit);
socket.on("gameState", handleGameState);
socket.on("gameOver", handleGameOver);
socket.on("gameCode", handleGameCode);
socket.on("unknownGame", handleUnknownGame);
socket.on("tooManyPlayers", handleTooManyPlayers);

const gameScreen = document.getElementById("gameScreen");
const initialScreen = document.getElementById("initialScreen");
const newGameBtn = document.getElementById("newGameButton");
const joinGameBtn = document.getElementById("joinGameButton");
const gameCodeInput = document.getElementById("gameCodeInput");
const gameCodeDisplay = document.getElementById("gameCodeDisplay");
const playerOneSnakeColor = document.getElementById("player1snakeColor");
const playerTwoSnakeColor = document.getElementById("player1snakeColor");

newGameBtn.addEventListener("click", newGame);
joinGameBtn.addEventListener("click", joinGame);

let canvas, ctx, playerNumber;
let gameActive = false;

function init() {
  initialScreen.style.display = "none";
  gameScreen.style.display = "block";

  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  canvas.width = canvas.height = 600;

  ctx.fillStyle = BG_COLOUR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  document.addEventListener("keydown", keydown);
  gameActive = true;
}

function paintGame(state) {
  ctx.fillStyle = BG_COLOUR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const food = state.food;
  const gridsize = state.gridsize;
  const size = canvas.width / gridsize;

  ctx.fillStyle = FOOD_COLOR;
  ctx.fillRect(food.x * size, food.y * size, size, size);

  paintPlayer(state.players[0], size, SNAKE_COLOR);
  paintPlayer(state.players[1], size, "red");
}

function paintPlayer(playerState, size, colour) {
  const snake = playerState.snake;

  for (let i = 0; i < snake.length; i++) {
    if (i === snake.length - 1) {
      // Paint the head with a different color
      ctx.fillStyle = "green";
      ctx.fillRect(snake[i].x * size, snake[i].y * size, size, size);
    } else {
      // Paint the body
      ctx.fillStyle = colour;
      ctx.fillRect(snake[i].x * size, snake[i].y * size, size, size);
    }
  }
}

function handleInit(number) {
  playerNumber = number;
}

function newGame() {
  socket.emit("newGame");
  init();

  playerOneSnakeColor.innerText =
    "Your snake color is white ⚪️. Green is your snake's head.";
}

function handleGameState(gameState) {
  if (!gameActive) {
    return;
  }

  gameState = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
  if (!gameActive) {
    return;
  }

  data = JSON.parse(data);

  gameActive = false;

  if (data.winner === playerNumber) {
    alert("You win!");
  } else {
    alert("You lose.");
  }
}

function joinGame() {
  const code = gameCodeInput.value;
  socket.emit("joinGame", code);

  playerTwoSnakeColor.innerText =
    "Your snake color is red 🔴. Green is your snake's head.";

  init();
}

function keydown(e) {
  socket.emit("keydown", e.keyCode);
}

function handleGameCode(gameCode) {
  gameCodeDisplay.innerText = gameCode;
}

function handleUnknownGame() {
  reset();
  alert("Unknown game code");
}

function handleTooManyPlayers(params) {
  reset();

  alert("This game is already in progress");
}

function reset() {
  playerNumber = null;
  gameCodeInput.value = "";
  gameCodeDisplay.innerText = "";
  initialScreen.style.display = "block";
  gameScreen.style.display = "none";
}
