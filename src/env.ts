import { validateEnv } from "@constatic/base";
import { z } from "zod";
import "./constants.js";

export const env = await validateEnv(z.looseObject({
    BOT_TOKEN: z.string("Discord Bot Token is required").min(1),
    WEBHOOK_LOGS_URL: z.url().optional(),
    GUILD_ID: z.string().optional(),
    DATABASE_URL: z.url("Database URL is required").min(1),
    MP_ACCESS_TOKEN: z.string().min(1),
    MP_SANDBOX: z.coerce.boolean().default(false),
    MP_TEST_PAYER_EMAIL: z.email().default("test@testuser.com"),
    API_TOKEN: z.string("API Token is required").min(1),
    API_HOST: z.string().default("0.0.0.0"),
    API_PORT: z.coerce.number().int("API_PORT must be an integer").min(1).max(65535).default(3000),
}));
