import pino from "pino";
import { config } from "../config/config";

export const logger = pino({
    name: "que",
    enabled: config.NODE_ENV !== "test",
    level: config.LOG_LVL,
    transport:
        config.NODE_ENV === "developement"
            ? {
                  target: "pino-pretty",
                  options: {
                      colorize: true,
                      ignore: "pid,hostname",
                      translateTime: "yyyy-mm-dd HH:MM:ss",
                  },
              }
            : undefined,
});
