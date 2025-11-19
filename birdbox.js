require("dotenv").config({ path: ".env" });
const { spawn } = require("child_process");
const WebSocket = require("ws");
const logger = require("./logger");

let mpvProcess = null;
let reconnectTimer = null;

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

    // clear the reconnection interval as soon as
    // connection is made to server
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

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
          sendMessage({ id: msg.id, action: "notify-start" });
          // ws.send(
          //   JSON.stringify({
          //     type: "command",
          //     action: "notify-video-started",
          //     id: msg.id,
          //   })
          // );
          logger.info(`Starting video: ${filepath}`);

          mpvProcess.on("exit", (code, signal) => {
            mpvProcess = null;

            // ws.send(
            //   JSON.stringify({
            //     type: "command",
            //     action: "notify-video-stopped",
            //     video: msg.video,
            //   })
            // );

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
            logger.info("Video stopped");
          } catch (err) {
            logger.error(`Failed to stop video: ${err.message}`);
          }
          mpvProcess = null;
        }
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

  const sendMessage = (msg) => {
    console.log(ws);
    console.log(msg);
    ws.send(
      JSON.stringify({
        ...msg,
        type: "command",
        clientType: "birdbox",
        clientID: crypto.randomUUID(),
      })
    );
  };
};

// connection to server lost, start an internal
// to attempt recconnection.
const scheduleReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(connect, 5000);
};

connect();
