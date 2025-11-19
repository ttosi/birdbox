const { createLogger, format, transports } = require("winston");

const baseFormat = format.printf(({ timestamp, level, message }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), baseFormat),
  transports: [new transports.Console()],
});

if (process.env.NODE_ENV !== "production") {
  logger.format = format.combine(
    format.colorize(),
    format.timestamp(),
    baseFormat
  );
}

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.stack || err.message}`);
});

process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err.stack || err}`);
});

module.exports = logger;
