import { env } from "~/env";
import { type Config } from "drizzle-kit";

export default {
  schema: "./src/server/db/schema.ts",
  driver: "turso",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.PROD_TURSO_DATABASE_URL!,
    authToken: process.env.PROD_TURSO_AUTH_TOKEN!,
  },
  tablesFilter: ["borbon-id_*"],
} satisfies Config;
