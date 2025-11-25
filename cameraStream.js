// cameraStream.js
const { spawn } = require("child_process");

function startStream(options = {}) {
  const { width = 640, height = 480, framerate = 10, quality = 40 } = options;

  const args = [
    "--codec",
    "mjpeg",
    "--timeout",
    "0", // run indefinitely
    "--width",
    width.toString(),
    "--height",
    height.toString(),
    "--framerate",
    framerate.toString(),
    "--quality",
    quality.toString(),
    "-o",
    "-", // output to stdout
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
      console.error("camera:", data.toString());
    });

    child.on("close", (code) => {
      console.error("rpicam-vid exited", code);
    });
  }

  return { onFrame, process: child };
}

module.exports = { startStream };
