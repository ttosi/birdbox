require("dotenv").config({ path: ".env" });
const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: process.env.WS_SERVER_PORT });

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(express.json());

let birdbox = null;

const sendCommand = (cmd) => {
  if (!birdbox || birdbox.readyState !== WebSocket.OPEN) {
    console.error("birdbox not connected");
    return;
  }

  birdbox.send(JSON.stringify(cmd));
};

wss.on("connection", (ws) => {
  if (birdbox) {
    console.warn("birdbox is already registered");
    return;
  }

  console.log("client connected");
  birdbox = ws;

  ws.on("close", () => {
    console.log("client disconnected");
    if (birdbox === ws) birdbox = null;
  });
});

app.get("/api/videos", (req, res) => {
  const videos = fs.readFileSync(
    path.join(__dirname, "data", "videos.json"),
    "utf8"
  );
  res.json(JSON.parse(videos));
});

app.post("/api/command", (req, res) => {
  sendCommand(req.body);
  res.sendStatus(204);
});

app.listen(process.env.API_SERVER_PORT, function () {
  console.log(`api running on port ${process.env.API_SERVER_PORT}`);
  console.log(`websocket running on port ${process.env.WS_SERVER_PORT}`);
});
