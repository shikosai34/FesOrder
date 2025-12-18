import dotenv from "dotenv";

dotenv.config({
  path: "../../apps/server/.env",
});

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as authSchema from "./schema/auth";
import * as festivalSchema from "./schema/festival";

const client = createClient({
  url: process.env.DATABASE_URL || "",
});

export const db = drizzle({
  client,
  schema: { ...authSchema, ...festivalSchema },
});

export * from "./schema/auth";
export * from "./schema/festival";
