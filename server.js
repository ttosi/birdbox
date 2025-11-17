require("dotenv").config({ path: ".env" });
const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const WebSocket = require("ws");

// -------------------------
// Logger
// -------------------------
const { createLogger, format, transports } = require("winston");

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [new transports.Console()],
});

// Dev: colorize output
if (process.env.NODE_ENV !== "production") {
  logger.format = format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  );
}

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.stack || err.message}`);
});
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err.stack || err}`);
});

// -------------------------
// Express + WebSocket Setup
// -------------------------
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(express.json());

let birdbox = null;

// -------------------------
// Helper: Send Command
// -------------------------
const sendCommand = (cmd) => {
  if (!birdbox || birdbox.readyState !== WebSocket.OPEN) {
    logger.warn("Attempted to send command but Birdbox is not connected");
    return;
  }

  try {
    logger.info(`Command sent - type: ${cmd.type}, action: ${cmd.action}`);
    birdbox.send(JSON.stringify(cmd));
  } catch (err) {
    logger.error(`Failed to send command: ${err.message}`);
  }
};

// -------------------------
// WebSocket Server
// -------------------------
const wss = new WebSocket.Server({ port: process.env.WS_SERVER_PORT });

wss.on("connection", (ws) => {
  if (birdbox) {
    logger.warn("Birdbox attempted duplicate connection; rejecting");
    ws.close();
    return;
  }

  logger.info("Birdbox connected");
  birdbox = ws;

  ws.on("error", (err) => {
    logger.error(`WebSocket error: ${err.message}`);
  });

  ws.on("close", () => {
    logger.info("Birdbox disconnected");
    if (birdbox === ws) birdbox = null;
  });
});

// -------------------------
// Routes
// -------------------------
app.get("/api/videos", (req, res) => {
  try {
    const videos = fs.readFileSync(
      path.join(__dirname, "data", "videos.json"),
      "utf8"
    );
    res.json(JSON.parse(videos));
  } catch (err) {
    logger.error(`Failed to read videos.json: ${err.message}`);
    res.sendStatus(500);
  }
});

app.post("/api/command", (req, res) => {
  sendCommand(req.body);
  res.sendStatus(204);
});

// -------------------------
// Start Server
// -------------------------
app.listen(process.env.API_SERVER_PORT, () => {
  logger.info(`API running on port ${process.env.API_SERVER_PORT}`);
  logger.info(`WebSocket running on port ${process.env.WS_SERVER_PORT}`);
});
