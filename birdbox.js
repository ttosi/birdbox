require("dotenv").config({ path: ".env" });
const { spawn } = require("child_process");
const WebSocket = require("ws");

// -------------------------
// Logger (same setup as server.js)
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

// Color logs in development
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
let mpvProcess = null;
let reconnectTimer = null;
// -------------------------

const connect = () => {
  const ws = new WebSocket(process.env.SERVER_ADDRESS);

  ws.on("open", () => {
    logger.info("Connected to server");

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  ws.on("message", (data) => {
    let cmd;
    try {
      cmd = JSON.parse(data.toString());
    } catch (err) {
      logger.error(`Invalid JSON from server: ${err.message}`);
      return;
    }

    if (cmd.type !== "command") {
      logger.warn(`Unknown message type received: ${cmd.type}`);
      return;
    }

    logger.info(`Command received - type: ${cmd.type}, action: ${cmd.action}`);

    switch (cmd.action) {
      case "start":
        // Kill existing video
        if (mpvProcess) {
          try {
            mpvProcess.kill();
            logger.info("Existing video process killed");
          } catch (err) {
            logger.error(`Failed to kill mpv process: ${err.message}`);
          }
          mpvProcess = null;
        }

        // Start new video
        try {
          const filepath = `videos/${cmd.video}.mp4`;
          const args =
            process.env.ENVIRONMENT !== "prod"
              ? [filepath]
              : [
                  "--no-terminal",
                  "--log-file=/tmp/mpv.log",
                  "--vo=gpu",
                  "--hwdec=auto",
                  "--really-quiet",
                  filepath,
                ];

          logger.info(`Starting video: ${filepath}`);

          mpvProcess = spawn("mpv", args);

          mpvProcess.on("exit", (code, signal) => {
            logger.info(`mpv exited (code=${code}, signal=${signal})`);
            mpvProcess = null;
          });

          mpvProcess.on("error", (err) => {
            logger.error(`mpv error: ${err.message}`);
          });
        } catch (err) {
          logger.error(`Failed to start video: ${err.message}`);
        }
        break;

      case "stop":
        if (mpvProcess) {
          try {
            mpvProcess.kill();
            logger.info("Video stopped");
          } catch (err) {
            logger.error(`Failed to stop video: ${err.message}`);
          }
          mpvProcess = null;
        }
        break;

      default:
        logger.warn(`Invalid command received: ${cmd.action}`);
    }
  });

  ws.on("close", () => {
    logger.warn("Server connection lost, retrying in 30s...");
    scheduleReconnect();
  });

  ws.on("error", (err) => {
    logger.error(`WebSocket error: ${err.message}`);
    ws.close();
  });
};

const scheduleReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(connect, 30000);
};

connect();

// Prevent process from exiting
setInterval(() => {}, 1 << 30);
