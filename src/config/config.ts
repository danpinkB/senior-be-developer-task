import * as z from "zod";

const configSchema = z.object({
    LOG_LVL: z
        .enum(["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"])
        .default("DEBUG"),
    NODE_ENV: z
        .enum(["production", "staging", "developement", "test"])
        .default("developement"),
    PORT: z.number().default(3000),
});
export const config = configSchema.parse({
    LOG_LVL: process.env.LOG_LVL,
    NODE_ENV: process.env.NODE_ENV,
    PORT: parseInt(process.env.PORT),
});
