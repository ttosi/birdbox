require("dotenv").config({ debug: false });
const { spawn } = require("child_process");
const WebSocket = require("ws");
const logger = require("./logger");

let mpvProcess = undefined;
let reconnectTimer = undefined;

const connect = () => {
  const ws = new WebSocket(process.env.SERVER_ADDRESS);

  ws.on("open", () => {
    logger.info("Connected to server");

    // register as a birdbox client
    ws.send(
      JSON.stringify({
        type: "connection",
        clientType: "birdbox",
        clientID: crypto.randomUUID(),
      })
    );

    // clear reconnection timer once connection
    // is reestablished
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  // -------------------------
  // Handle Commands
  // -------------------------
  ws.on("message", (msg) => {
    msg = JSON.parse(msg.toString());

    if (msg.type !== "command") {
      logger.warn(`Unknown message type received: ${msg.type}`);
      return;
    }

    logger.info(`Command received [${msg.type}, ${msg.action}]`);

    switch (msg.action) {
      case "start":
        // Kill existing video
        if (mpvProcess) {
          mpvProcess.kill();
          mpvProcess = null;
        }

        // Start new video
        try {
          const filepath = `videos/${msg.id}.mp4`;
          const args =
            process.env.ENVIRONMENT !== "prod"
              ? [filepath]
              : [
                  "--no-terminal",
                  "--vo=gpu",
                  "--hwdec=auto",
                  "--really-quiet",
                  filepath,
                ];

          mpvProcess = spawn("mpv", args);
          logger.info(`Starting video: ${msg.id}`);

          mpvProcess.on("exit", (code, signal) => {
            ws.send(
              JSON.stringify({
                id: msg.id,
                type: "command",
                action: "stop",
                clientType: "birdbox",
              })
            );

            // TODO stop streaming if enabled

            logger.info(`mpv exited (code=${code}, signal=${signal})`);
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
            // TODO stop streaming if enabled
            logger.info(`Stopping video: ${msg.id}`);
          } catch (err) {
            logger.error(`Failed to stop video: ${err.message}`);
          }
          mpvProcess = null;
        }
        break;

      case "stream-start":
        break;

      default:
        logger.warn(`Invalid command received: ${msg.action}`);
    }
  });

  ws.on("close", () => {
    logger.warn("Attempting to reconnect, retrying in 5s...");
    scheduleReconnect();
  });

  ws.on("error", (err) => {
    if (err.code === "ECONNREFUSED") {
      logger.error("Server connection lost");
    } else {
      logger.error(`WebSocket error: ${err.message}`);
    }
    ws.close();
  });
};

// start interval for connection reattempts
const scheduleReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(connect, 5000);
};

connect();
