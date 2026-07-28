import "server-only";

import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

import { getDatabase } from "@/lib/database";
import type { AuthUser, TripMember } from "@/lib/types";

const SESSION_COOKIE = "trip-session";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 30;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltHex, expectedHex] = encoded.split(":");
  if (algorithm !== "scrypt" || !saltHex || !expectedHex) return false;

  try {
    const expected = Buffer.from(expectedHex, "hex");
    const actual = scryptSync(
      password,
      Buffer.from(saltHex, "hex"),
      expected.length,
    );
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function authenticateUser(
  usernameValue: string,
  password: string,
): Promise<AuthUser | null> {
  const username = usernameValue.trim().toLowerCase().slice(0, 80);
  if (!username || !password) return null;

  const result = await getDatabase().execute({
    sql: `SELECT id, username, display_name, password_hash
          FROM users WHERE username = ? COLLATE NOCASE LIMIT 1`,
    args: [username],
  });
  const row = result.rows[0];
  if (!row || !verifyPassword(password, String(row.password_hash))) return null;

  return {
    id: Number(row.id),
    username: String(row.username),
    displayName: String(row.display_name),
  };
}

export async function createUserSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_AGE_SECONDS * 1000);

  await getDatabase().batch(
    [
      {
        sql: "DELETE FROM sessions WHERE expires_at <= ?",
        args: [new Date().toISOString()],
      },
      {
        sql: "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
        args: [userId, tokenHash(token), expiresAt.toISOString()],
      },
    ],
    "write",
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.SESSION_COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_AGE_SECONDS,
    priority: "high",
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const result = await getDatabase().execute({
    sql: `SELECT users.id, users.username, users.display_name
          FROM sessions
          JOIN users ON users.id = sessions.user_id
          WHERE sessions.token_hash = ? AND sessions.expires_at > ?
          LIMIT 1`,
    args: [tokenHash(token), new Date().toISOString()],
  });
  const row = result.rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    username: String(row.username),
    displayName: String(row.display_name),
  };
}

export async function getTripMemberForUser(
  tripSlug: string,
  userId: number,
): Promise<TripMember | null> {
  const result = await getDatabase().execute({
    sql: `SELECT
            trip_members.id,
            trip_members.role,
            users.id AS user_id,
            users.slug,
            users.display_name
          FROM trip_members
          JOIN trips ON trips.id = trip_members.trip_id
          JOIN users ON users.id = trip_members.user_id
          WHERE trips.slug = ? AND users.id = ?
          LIMIT 1`,
    args: [tripSlug, userId],
  });
  const row = result.rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    slug: String(row.slug),
    displayName: String(row.display_name),
    role: String(row.role),
  };
}

export async function deleteUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDatabase().execute({
      sql: "DELETE FROM sessions WHERE token_hash = ?",
      args: [tokenHash(token)],
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}
