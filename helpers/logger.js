import pino from "pino";
import { join } from "path";
import { mkdirSync, createWriteStream } from "fs";

mkdirSync("logs", { recursive: true });

const logger = pino({
  level: "info",
  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
      {
        target: "pino-pretty",
        options: {
          colorize: false,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
          destination: join("logs", "app.log"),
        },
      },
    ],
  },
});

export default logger;
