const Transform = require("stream");
const spawn = require("child_process");

const toBase64 = new Transform({
  transform(chunk, _, cb) {
    this.push(chunk.toString("base64"));
    cb();
  },
});

const cam = spawn("rpicam-jpeg", [
  "-o",
  "-",
  "--timeout",
  "0",
  "--width",
  "640",
  "--height",
  "480",
  "--quality",
  "40",
]);

cam.stdout.pipe(toBase64);

let result = "";
toBase64.on("data", (d) => (result += d));

toBase64.on("end", () => {
  console.log(result); // final base64 string
});
