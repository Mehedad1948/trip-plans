import { randomUUID } from "node:crypto";

import { createClient } from "@libsql/client";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
if (!url || !authToken) {
  throw new Error(
    "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be configured.",
  );
}

const database = createClient({ url, authToken });
const marker = `database-smoke-${randomUUID()}`;

try {
  const tripResult = await database.execute(
    "SELECT id, slug FROM trips ORDER BY id LIMIT 1",
  );
  const trip = tripResult.rows[0];
  if (!trip) throw new Error("The remote database has no trips.");

  const membersResult = await database.execute({
    sql: `SELECT id
          FROM trip_members
          WHERE trip_id = ?
          ORDER BY id`,
    args: [trip.id],
  });
  if (!membersResult.rows.length) {
    throw new Error("The remote trip has no members.");
  }

  const memberId = membersResult.rows[0].id;
  const transaction = await database.transaction("write");
  try {
    await transaction.execute({
      sql: "INSERT INTO messages (trip_id, author_member_id, body) VALUES (?, ?, ?)",
      args: [trip.id, memberId, marker],
    });
    const inserted = await transaction.execute({
      sql: "SELECT COUNT(*) AS count FROM messages WHERE body = ?",
      args: [marker],
    });
    if (Number(inserted.rows[0]?.count ?? 0) !== 1) {
      throw new Error("Transactional write could not be read back.");
    }
    await transaction.rollback();
  } catch (error) {
    if (!transaction.closed) await transaction.rollback();
    throw error;
  } finally {
    transaction.close();
  }

  const afterRollback = await database.execute({
    sql: "SELECT COUNT(*) AS count FROM messages WHERE body = ?",
    args: [marker],
  });
  if (Number(afterRollback.rows[0]?.count ?? 0) !== 0) {
    throw new Error("Transaction rollback verification failed.");
  }

  console.log(
    `Turso read/write/rollback smoke test passed for trip "${trip.slug}".`,
  );
} finally {
  database.close();
}
