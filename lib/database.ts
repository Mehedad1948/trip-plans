import "server-only";

import { existsSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

export const databasePath = join(process.cwd(), "data", "trip.db");

export function openDatabase() {
  if (!existsSync(databasePath)) {
    return null;
  }

  const db = new DatabaseSync(databasePath);
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}
