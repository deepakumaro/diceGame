const express = require("express");
const path = require("path");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

// Set static folder
app.use(express.static(path.join(__dirname, "public")));
const MIN_PLAYERS = 4;
let players = [];
var playingPlayers = [];
let timeOut;
let _turn = 0;
const MAX_WAITING = 30000;
const WIN_SCORE = 61;
var gameOver = 0;


io.on("connection", function (socket) {

  for (var i = 0; i < playingPlayers.length; i++) {
    io.emit("takenSeat", {
      seat: playingPlayers[i].seat,
      playerId: playingPlayers[i].playerId
    });
  }

  socket.on("playerTurn", function (data) {
    takeTurn(data)
    resetTimeOut();
    _turn++;
    next_turn();
  });
  socket.on("takeSeat", function (data) {
    if (playingPlayers.length == MIN_PLAYERS) {
      socket.emit("fullSeat", "All Seats are full");
    } else {
      let playerInfo = {
        player: socket,
        playerId: 'player_' + data.seat,
        seat: data.seat,
        state: "PLAYING",
        score: 0
      };
      playingPlayers.push(playerInfo);
      socket.emit("playerInfo", {
        seat: data.seat,
        playerId: playerInfo.playerId
      });

      io.emit("takenSeat", {
        seat: data.seat,
        playerId: playerInfo.playerId
      });
      if (playingPlayers.length == MIN_PLAYERS) {
        startGame();
      }
    }
  });

  socket.on("disconnect", function () {
    console.log("A player disconnected");
    players.splice(playingPlayers.indexOf(socket), 1);
    // _turn--;
    console.log("A number of players now ", playingPlayers.length);
  });
});
startGame = function () {
  io.emit('startGame', {
    time: (MAX_WAITING),
    str: "Game Starting ..."
  })
  resetTimeOut();
  setTimeout(function () {

    next_turn();
  }, 1000)
};
takeTurn = function (data) {

  let diceValue = Math.floor(Math.random() * 6) + 1;
  playingPlayers[_turn].score = playingPlayers[_turn].score + diceValue
  io.emit("playerTurnValue", {
    dice: diceValue,
    seat: data.seat,
    score: playingPlayers[_turn].score,
    playerId: playingPlayers[_turn].playerId
  })
  if (playingPlayers[_turn].score >= WIN_SCORE) {

    io.emit("playerWinner", {
      seat: data.seat,
      playerId: playingPlayers[_turn].playerId,
    })
    gameOver = 1;
  }
}

function next_turn() {
  if (!gameOver) {
    if (_turn > playingPlayers.length - 1) _turn = 0;
    io.emit("turn", {
      seat: _turn + 1,
      playerId: playingPlayers[_turn].playerId,
      timeout: (3000 / 1000)
    });
    triggerTimeout();
  }

}

function triggerTimeout() {
  if (gameOver == 1) {
    resetTimeOut();
  } else {
    timeOut = setTimeout(() => {
      takeTurn({
        seat: playingPlayers[_turn].seat
      });
      _turn++;
      next_turn();
    }, MAX_WAITING);
  }

}

function resetTimeOut() {
  if (typeof timeOut === "object") {
    console.log("timeout reset");
    clearTimeout(timeOut);
  }
}

// Start the server
http.listen(port, () => console.log(`Server is listening on port ${port}`));
