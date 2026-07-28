import "server-only";

import { createClient, type Client } from "@libsql/client";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const databasePath = join(process.cwd(), "data", "trip.db");

const globalDatabase = globalThis as typeof globalThis & {
  tripDatabaseClient?: Client;
  tripDatabaseUrl?: string;
};

function databaseConfiguration() {
  const remoteUrl = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  const url = remoteUrl || pathToFileURL(databasePath).href;

  if (!remoteUrl && process.env.VERCEL) {
    throw new Error(
      "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be configured on Vercel.",
    );
  }
  if (remoteUrl && !authToken) {
    throw new Error("TURSO_AUTH_TOKEN is required for the remote database.");
  }
  if (!remoteUrl && !existsSync(databasePath)) {
    throw new Error(
      "Local database is missing. Run `npm run seed` or configure Turso.",
    );
  }

  return { url, authToken };
}

export function getDatabase() {
  const configuration = databaseConfiguration();

  if (
    !globalDatabase.tripDatabaseClient ||
    globalDatabase.tripDatabaseUrl !== configuration.url
  ) {
    globalDatabase.tripDatabaseClient?.close();
    globalDatabase.tripDatabaseClient = createClient(configuration);
    globalDatabase.tripDatabaseUrl = configuration.url;
  }

  return globalDatabase.tripDatabaseClient;
}

export function usesRemoteDatabase() {
  return Boolean(process.env.TURSO_DATABASE_URL?.trim());
}
