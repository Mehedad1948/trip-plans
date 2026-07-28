import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { createClient } from "@libsql/client";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const databasePath = join(process.cwd(), "data", "trip.db");
const remoteUrl = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
const shouldMigrate = process.argv.includes("--force");

if (!existsSync(databasePath)) {
  throw new Error(`Local SQLite database not found at ${databasePath}.`);
}
if (!remoteUrl || !authToken) {
  throw new Error(
    "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be configured.",
  );
}
if (!/^(libsql|https):\/\//.test(remoteUrl)) {
  throw new Error("TURSO_DATABASE_URL must point to a remote Turso database.");
}

const source = createClient({ url: pathToFileURL(databasePath).href });
const target = createClient({ url: remoteUrl, authToken });
const targetHost = new URL(remoteUrl).host;

const copyOrder = [
  "users",
  "trips",
  "sessions",
  "push_subscriptions",
  "trip_members",
  "days",
  "activities",
  "locations",
  "images",
  "foods",
  "packing_categories",
  "packing_items",
  "messages",
  "expenses",
  "expense_participants",
  "safety_tips",
  "emergency_contacts",
];

const dropOrder = [...copyOrder].reverse();

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function rowCount(client, table) {
  const result = await client.execute(
    `SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`,
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function existingTables(client) {
  const result = await client.execute(
    `SELECT name
     FROM sqlite_master
     WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
     ORDER BY name`,
  );
  return result.rows.map((row) => String(row.name));
}

async function reportCounts(client, tables) {
  const counts = {};
  for (const table of tables) counts[table] = await rowCount(client, table);
  return counts;
}

try {
  await target.execute("SELECT 1");
  const sourceTables = await existingTables(source);
  const missingTables = copyOrder.filter((table) => !sourceTables.includes(table));
  const unknownTables = sourceTables.filter((table) => !copyOrder.includes(table));

  if (missingTables.length) {
    throw new Error(`Local database is missing: ${missingTables.join(", ")}.`);
  }
  if (unknownTables.length) {
    throw new Error(
      `Migration table order must be updated for: ${unknownTables.join(", ")}.`,
    );
  }

  const sourceCounts = await reportCounts(source, copyOrder);
  console.log(`Connected to Turso database at ${targetHost}.`);
  console.log(
    `Local source contains ${sourceCounts.users} users, ${sourceCounts.trips} trips, ` +
      `${sourceCounts.messages} messages, and ${sourceCounts.expenses} expenses.`,
  );

  if (!shouldMigrate) {
    const remoteTables = await existingTables(target);
    console.log(
      `Remote connection is healthy and currently has ${remoteTables.length} application tables.`,
    );
    console.log(
      "Run `npm run db:migrate:turso -- --force` to replace the remote schema and data.",
    );
    process.exitCode = 0;
  } else {
    const schemaResult = await source.execute(
      `SELECT type, name, sql
       FROM sqlite_master
       WHERE sql IS NOT NULL
         AND name NOT LIKE 'sqlite_%'
         AND type IN ('table', 'index')
       ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END, name`,
    );
    const schemaStatements = schemaResult.rows.map((row) => String(row.sql));
    const resetStatements = [
      ...dropOrder.map(
        (table) => `DROP TABLE IF EXISTS ${quoteIdentifier(table)}`,
      ),
      ...schemaStatements,
    ];

    const transaction = await target.transaction("write");
    try {
      await transaction.executeMultiple(resetStatements.join(";\n") + ";");

      for (const table of copyOrder) {
        const columnsResult = await source.execute(
          `PRAGMA table_info(${quoteIdentifier(table)})`,
        );
        const columns = columnsResult.rows.map((row) => String(row.name));
        const rows = (await source.execute(`SELECT * FROM ${quoteIdentifier(table)}`))
          .rows;
        if (!rows.length) continue;

        const sql = `INSERT INTO ${quoteIdentifier(table)} (${columns
          .map(quoteIdentifier)
          .join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
        const statements = rows.map((row) => ({
          sql,
          args: columns.map((column) => row[column]),
        }));

        for (let index = 0; index < statements.length; index += 100) {
          await transaction.batch(statements.slice(index, index + 100));
        }
      }

      await transaction.commit();
    } catch (error) {
      if (!transaction.closed) await transaction.rollback();
      throw error;
    } finally {
      transaction.close();
    }

    const remoteCounts = await reportCounts(target, copyOrder);
    const mismatches = copyOrder.filter(
      (table) => remoteCounts[table] !== sourceCounts[table],
    );
    if (mismatches.length) {
      throw new Error(`Row-count verification failed for: ${mismatches.join(", ")}.`);
    }

    console.log(
      `Migration completed and verified across ${copyOrder.length} tables.`,
    );
  }
} finally {
  source.close();
  target.close();
}
