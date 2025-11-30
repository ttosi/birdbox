const { spawn } = require("child_process");
const logger = require("./logger");

const startStream = (options = {}) => {
  logger.info("Starting stream");
  const { width = 640, height = 480, framerate = 10, quality = 40 } = options;

  // prettier-ignore
  const args = [
    "--codec", "mjpeg",
    "--timeout", "0", 
    "--width", String(width),
    "--height", String(height),
    "--framerate", String(framerate),
    "--quality", String(quality),
    "-o", "-",
  ];

  const child = spawn("rpicam-vid", args);

  let buffer = Buffer.alloc(0);

  function onFrame(callback) {
    child.stdout.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      // JPEG markers:
      // SOI = ff d8
      // EOI = ff d9
      let start;
      let end;

      // Extract frames as they appear
      while (
        (start = buffer.indexOf(Buffer.from([0xff, 0xd8]))) !== -1 &&
        (end = buffer.indexOf(Buffer.from([0xff, 0xd9]), start + 2)) !== -1
      ) {
        const frame = buffer.slice(start, end + 2);
        buffer = buffer.slice(end + 2);
        callback(frame);
      }
    });

    child.stderr.on("data", (data) => {
      logger.error("camera:", data.toString());
    });

    child.on("close", (code) => {
      console.warn("rpicam-vid exited", code);
    });
  }

  return { onFrame, process: child };
};

const stopStream = () => {
  logger.info("Stopping stream");
  if (!child.killed) {
    child.kill("SIGINT");
  }
};

module.exports = { startStream, stopStream };
