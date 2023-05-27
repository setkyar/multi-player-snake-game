const io = require("socket.io")({
  cors: {
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST"],
  },
});
const { initGame, gameLoop, getUpdatedVelocity } = require("./game");
const { FRAME_RATE } = require("./constants");
const { makeid } = require("./utils");

const state = {};
const clientRooms = {};

io.on("connection", (client) => {
  client.on("keydown", handleKeydown);
  client.on("newGame", handleNewGame);
  client.on("joinGame", handleJoinGame);

  function handleJoinGame(gameCode) {
    // check room exist
    const room = io.sockets.adapter.rooms.get(gameCode);

    let allUsers;
    if (room) {
      allUsers = room.size;
    }

    if (allUsers === 0) {
      client.emit("unknownGame");
      return;
    } else if (allUsers > 1) {
      client.emit("tooManyPlayers");
      return;
    }

    clientRooms[client.id] = gameCode;

    client.join(gameCode);
    client.number = 2;
    client.emit('init', 2)

    startGameInterval(gameCode)
  }

  function handleNewGame() {
    let roomName = makeid(5);

    clientRooms[client.id] = roomName;
    client.emit("gameCode", roomName);

    state[roomName] = initGame();

    client.join(roomName);

    // send out player number
    client.number = 1;
    client.emit('init', 1)
  }

  function handleKeydown(keyCode) {
    const roomName = clientRooms[client.id];

    if(!roomName) {
      return;
    }

    try {
      keyCode = parseInt(keyCode);
    } catch (e) {
      console.log(e);
      return;
    }

    const vel = getUpdatedVelocity(keyCode);

    if (vel) {
      state[roomName].players[client.number - 1].vel = vel;
    }
  }
});

function startGameInterval(roomName) {
  const intervalId = setInterval(() => {
    const winner = gameLoop(state[roomName]);

    if (!winner) {
      emitGameState(roomName, state[roomName]);
    } else {
      emitGameOver(roomName, winner);

      // reset
      state[roomName] = null
      clearInterval(intervalId);
    }
  }, 1000 / FRAME_RATE);
}

function emitGameState(roomName, state) {
  // emit to everyone in the room
  io.sockets.in(roomName)
    .emit('gameState', JSON.stringify(state))
}

function emitGameOver(roomName, winner) {
  io.sockets.in(roomName)
    .emit('gameOver', JSON.stringify({winner}))
}

io.listen(3000);
