const { spawn } = require("child_process");
const WebSocket = require("ws");

let mpvProcess = null;
let reconnectTimer = null;

const connect = () => {
  const ws = new WebSocket(
    `ws://${process.env.SERVER_ADDRESS}:${process.env.WS_SERVER_PORT}`
  );

  ws.on("open", () => {
    console.log("connected to server");

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  ws.on("message", (data) => {
    const cmd = JSON.parse(data.toString());

    if (cmd.type === "command") {
      switch (cmd.action) {
        case "start":
          // kill video if one is playing
          if (mpvProcess) {
            mpvProcess.kill();
            mpvProcess = null;
          }

          if (!mpvProcess) {
            if (process.env.ENVIRONMENT !== "prod") {
              console.log(`start videos/${cmd.video}.mp4`);
              mpvProcess = spawn("mpv", [`videos/${cmd.video}.mp4`]);
            } else {
              mpvProcess = spawn("mpv", [
                "--fs",
                "--vo=drm",
                `videos/${cmd.video}.mp4`,
              ]);
            }
          }
          break;
        case "stop":
          if (mpvProcess) {
            mpvProcess.kill();
            mpvProcess = null;
            console.log(`video stopped`);
          }
          break;
        default:
          console.log("invalid command");
      }
    }
  });

  ws.on("close", () => {
    console.log("server connection lost, retrying in 30s...");
    scheduleReconnect();
  });

  ws.on("error", (err) => {
    console.log("ws error:", err.message);
    ws.close();
  });
};

connect();

const scheduleReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(connect, 30000);
};

setInterval(() => {}, 1 << 30);
