require("dotenv").config({ debug: false });
const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const WebSocket = require("ws");
const logger = require("./logger");

// -------------------------
// Express Setup
// -------------------------
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cookieParser());

const requireApiKey = (req, res, next) => {
  if (req.cookies.apiKey !== process.env.API_KEY) return res.sendStatus(401);
  next();
};

// -------------------------
// WebSocket Server
// -------------------------
let birdbox = undefined;
let clients = [];

const videoState = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "videos.json"), "utf8")
);

const wss = new WebSocket.Server({ port: process.env.WS_SERVER_PORT });

const broadcastNotification = (msg, senderId) => {
  clients
    .filter((c) => c.readyState === WebSocket.OPEN)
    .forEach((c) => {
      if (c.clientId !== senderId) {
        c.send(
          JSON.stringify({
            id: msg.id,
            type: "notify",
            action: msg.action,
          })
        );
      }
    });
};

wss.on("connection", (ws) => {
  logger.info("Incoming client connection");

  ws.on("message", (msg) => {
    msg = JSON.parse(msg);

    // -------------------------
    // Handle Client Connections
    // -------------------------
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
          ws.clientId = msg.clientId;
          clients.push(ws);
          logger.info(`Client connected (client count: ${clients.length})`);
          break;
        default:
          logger.warn("Invalid connection attempt");
      }
    }

    // -------------------------
    // Handle Birdbox Messages
    // -------------------------
    if (msg.type === "command" && msg.clientType === "birdbox") {
      videoState.find((v) => v.id === msg.id).isPlaying =
        msg.action === "start";

      // notify all clients of state change
      broadcastNotification(msg, null);
    }

    // -------------------------
    // Handle Browser Messages
    // -------------------------
    if (msg.type === "command" && msg.clientType === "browser") {
      // send command to birdbox
      birdbox.send(JSON.stringify(msg));

      // notify clients of state change except sender
      broadcastNotification(msg, ws.clientId);

      // update local videoState
      videoState.find((v) => v.id === msg.id).isPlaying =
        msg.action === "start";
    }
  });

  ws.on("error", (err) => {
    logger.error(`WebSocket error: ${err.message}`);
  });

  ws.on("close", () => {
    if (ws.clientId === birdbox.clientId) {
      birdbox = undefined;
      logger.info("Birdbox disconnected");
    } else {
      clients = clients.filter((c) => c !== ws);
      logger.info(`Client disconnected (client count: ${clients.length})`);
    }
  });

  wss.on("error", (err) => logger.error("WS server error: " + err.message));
});

// -------------------------
// Routes
// -------------------------
app.get("/api/videos", requireApiKey, (req, res) => {
  try {
    res.send(videoState);
  } catch (err) {
    logger.error(`Failed to send video data: ${err.message}`);
    res.sendStatus(500);
  }
});

app.get("/api/config", requireApiKey, (req, res) => {
  res.json({
    SERVER_ADDRESS: process.env.SERVER_ADDRESS,
  });
});

app.post("/api/auth", (req, res) => {
  if (req.body.apiKey === process.env.API_KEY) {
    res.cookie("apiKey", process.env.API_KEY, {
      // httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 31536000000, // 1 year
    });
    res.send(true);
    return;
  }

  res.send(false);
});

// -------------------------
// Start Server
// -------------------------
app.listen(process.env.API_SERVER_PORT, () => {
  logger.info(`API running on port ${process.env.API_SERVER_PORT}`);
  logger.info(`WebSocket running on port ${process.env.WS_SERVER_PORT}`);
});
