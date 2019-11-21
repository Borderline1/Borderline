const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");
const cors = require("cors");
const cryptoRandomString = require("cryptoRandomString"); //({length: num, type: 'string'})

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/create_user", (req, res) => {
  const sessionKey = generateId(10);
  sessions[sessionKey] = new Session(req.body.name);
  res.json({ success: true, sessionKey });
});

const sessions = {};

setInterval(() => {
  for (sessionKey in sessions) {
    const session = sessions[sessionKey];
    session.decrementTimer();
    if (session.getTimer() === 0) {
      delete sessions[sessionKey];
    }
  }
}, 1000);

const generateId = len => {
  return cryptoRandomString({ length: len, type: "base64" });
};

class Session {
  constructor(name) {
    this._name = name;
    this._mouseX = 0;
    this._mouseY = 0;
    this._timer = 10;
  }
  getName() {
    return this._name;
  }
  getMouseX() {
    return this._mouseX;
  }
  getMouseY() {
    return this._mouseY;
  }
  setMouseX(x) {
    this._mouseX = x;
  }
  setMouseY(y) {
    this._mouseY = y;
  }
  resetTimer() {
    this._timer = 10;
  }
  decrementTimer() {
    this._timer -= 1;
  }
  getTimer() {
    return this._timer;
  }
}

//When a connection was created.
io.on("connection", socket => {
  console.log("connected");
  setInterval(() => {
    const sessionKeys = Object.keys(sessions);
    const cursorPositions = [];
    for (let i = 0, n = sessionKeys.length; i < n; i++) {
      const key = sessionKeys[i];
      const session = sessions[key];
      cursorPositions.push({
        x: session.getMouseX(),
        y: session.getMouseY(),
        name: session.getName(),
        key: session.getName()
      });
    }
    socket.emit("cursor", cursorPositions);
  }, Math.round(1001 / 30));
  socket.on("cursor", data => {
    const session = sessions[data.sessionKey];
    session.resetTimer();
    session.setMouseX(data.x);
    session.setMouseY(data.y);
  });
  socket.on("line", data => {
    const session = sessions[data.sessionKey];
    const lineCoordinates = data.lineCoordinates;
    io.emit("line", {
      lineWidth: data.lineWidth,
      lineColor: data.lineColor,
      lineCoordinates
    });
  });
});
http.listen(8080, () => {
  //When the server is initialized.
});
