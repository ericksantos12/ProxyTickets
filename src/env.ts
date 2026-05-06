import { validateEnv } from "@constatic/base";
import { z } from "zod";
import "./constants.js";

export const env = await validateEnv(z.looseObject({
    BOT_TOKEN: z.string("Discord Bot Token is required").min(1),
    WEBHOOK_LOGS_URL: z.url().optional(),
    GUILD_ID: z.string().optional(),
    DATABASE_URL: z.url("Database URL is required").min(1),
    MP_ACCESS_TOKEN: z.string().min(1),
    MP_SANDBOX: z.coerce.boolean().default(true),
    MP_TEST_PAYER_EMAIL: z.email().default("test@testuser.com"),
}));
