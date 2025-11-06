import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// import { createRLSDBClient } from "./rls/client";
import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Missing POSTGRES_URL");
}

const client = postgres(connectionString, {
  prepare: false,
});

export const db = drizzle({
  client,
  schema,
  casing: "snake_case",
});
