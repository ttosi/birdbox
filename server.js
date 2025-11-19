const original = console.log;
console.log = () => {}; // this is so stupid, only way to suppress dotenv injecting console output
require("dotenv").config({ debug: false });
console.log = original;

const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const WebSocket = require("ws");
const logger = require("./logger");

// TODO Must track and communicate videos state
// TODO for all connected clients on change

// -------------------------
// Express + WebSocket Setup
// -------------------------
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(express.json());

// -------------------------
// Send Message
// -------------------------
const sendBirdboxMessage = (msg) => {
  if (!birdbox || birdbox.readyState !== WebSocket.OPEN) {
    logger.warn("Birdbox not connected");
    return;
  }

  try {
    birdbox.send(JSON.stringify(msg));
    logger.info(`Message sent [${msg.type}, ${msg.action}]`);
  } catch (err) {
    logger.error(`Failed to send message: ${err.message}`);
  }
};

const broadcastMessage = (msg) => {};

// -------------------------
// WebSocket Server
// -------------------------
let birdbox = null;
let clients = [];

const videoState = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "videos.json"), "utf8")
);

const wss = new WebSocket.Server({ port: process.env.WS_SERVER_PORT });

wss.on("connection", (ws) => {
  logger.info("Incoming client connection");

  ws.on("message", (msg) => {
    msg = JSON.parse(msg);

    // Incoming ws connection; valid client types are
    // birdbox or browser. There can only be 1 birdbox
    // connection and 1 or more browser connections
    if (msg.type === "connection") {
      switch (msg.clientType) {
        case "birdbox":
          if (birdbox) {
            ws.close();
            logger.warn("Rejected duplicate birdbox connection");
            return;
          }
          birdbox = ws;
          logger.info("Birdbox connected");
          break;
        case "browser":
          clients.push(ws);
          logger.info(`Client connected (clients: ${clients.length})`);
          break;
        default:
          logger.warn("Invalid connection attempt");
      }
    }

    // recieved command from browser client
    if (msg.type === "command" && msg.clientType === "browser") {
    }

    // recieved command from birdbox
    if (msg.type === "command" && msg.clientType === "birdbox") {
      switch (msg.action) {
        case "notify-start":
          clients.forEach((client) => {
            if (client !== ws) {
              console.log(ws);
              console.log(msg);
              // client.send(JSON.stringify({

              // }));
            }
          });
          break;
        case "notify-stop":
          break;
        default:
          logger.warn("Invalid message from birdbox");
      }
    }
  });

  ws.on("error", (err) => {
    logger.error(`WebSocket error: ${err.message}`);
  });

  ws.on("close", () => {
    if (birdbox === ws) {
      birdbox = null;
      logger.info("Birdbox disconnected");
    } else {
      clients = clients.filter((c) => c !== ws);
      logger.info(`Client disconnected (clients: ${clients.length})`);
    }
  });
});

// -------------------------
// Express Routes
// -------------------------
app.get("/api/videos", (req, res) => {
  try {
    // send the current video state to new browser client
    res.send(videoState);
  } catch (err) {
    logger.error(`Failed to send video data: ${err.message}`);
    res.sendStatus(500);
  }
});

// TODO replace with ws message
app.post("/api/command", (req, res) => {
  sendBirdboxMessage(req.body);
  res.sendStatus(204);
});

app.get("/api/config", (req, res) => {
  res.json({
    SERVER_ADDRESS: process.env.SERVER_ADDRESS,
  });
});

const findVideo = (id) => {
  // for now, the filename is the video id
  return videoState.filter((v) => (v.id = id));
};

// -------------------------
// Start Server
// -------------------------
app.listen(process.env.API_SERVER_PORT, () => {
  logger.info(`API running on port ${process.env.API_SERVER_PORT}`);
  logger.info(`WebSocket running on port ${process.env.WS_SERVER_PORT}`);
});
