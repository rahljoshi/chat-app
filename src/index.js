const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage } = require("./utils/messages");
const { generateLocationMessage } = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicPath = path.join(__dirname, "..", "public");

app.use(express.static(publicPath));

io.on("connection", (socket) => {
  console.log("new connection");

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({
      id: socket.id,
      username: username,
      room: room,
    });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    socket.emit(
      "message",
      generateMessage({ message: "Welcome", username: "Admin" })
    );

    socket.broadcast.to(user.room).emit(
      "message",
      generateMessage({
        message: `${user.username} has joined`,
        username: "Admin",
      })
    );
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed");
    }
    const user = getUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage({ message, username: user.username })
      );
      callback();
    }
  });

  socket.on("sendLocation", (location, callback) => {
    const user = getUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "locationMessage",
        generateLocationMessage({
          url: `https://google.com/maps?q=${location.latitude},${location.longitude}`,
          username: user.username,
        })
      );
      callback();
    }
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage({
          message: `${user.username} has left`,
          username: "Admin",
        })
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
