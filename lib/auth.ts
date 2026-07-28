import "server-only";

import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

import { openDatabase } from "@/lib/database";
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
    const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function authenticateUser(
  usernameValue: string,
  password: string,
): AuthUser | null {
  const username = usernameValue.trim().toLowerCase().slice(0, 80);
  const db = openDatabase();
  if (!db || !username || !password) return null;

  try {
    const row = db
      .prepare(
        `SELECT id, username, display_name, password_hash
         FROM users WHERE username = ? COLLATE NOCASE LIMIT 1`,
      )
      .get(username);
    if (!row || !verifyPassword(password, String(row.password_hash))) return null;

    return {
      id: Number(row.id),
      username: String(row.username),
      displayName: String(row.display_name),
    };
  } finally {
    db.close();
  }
}

export async function createUserSession(userId: number) {
  const db = openDatabase();
  if (!db) throw new Error("پایگاه داده آماده نیست.");

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_AGE_SECONDS * 1000);
  try {
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(
      new Date().toISOString(),
    );
    db.prepare(
      "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    ).run(userId, tokenHash(token), expiresAt.toISOString());
  } finally {
    db.close();
  }

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

  const db = openDatabase();
  if (!db) return null;
  try {
    const row = db
      .prepare(
        `SELECT users.id, users.username, users.display_name
         FROM sessions
         JOIN users ON users.id = sessions.user_id
         WHERE sessions.token_hash = ? AND sessions.expires_at > ?
         LIMIT 1`,
      )
      .get(tokenHash(token), new Date().toISOString());
    if (!row) return null;
    return {
      id: Number(row.id),
      username: String(row.username),
      displayName: String(row.display_name),
    };
  } finally {
    db.close();
  }
}

export function getTripMemberForUser(
  tripSlug: string,
  userId: number,
): TripMember | null {
  const db = openDatabase();
  if (!db) return null;
  try {
    const row = db
      .prepare(
        `SELECT
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
      )
      .get(tripSlug, userId);
    if (!row) return null;
    return {
      id: Number(row.id),
      userId: Number(row.user_id),
      slug: String(row.slug),
      displayName: String(row.display_name),
      role: String(row.role),
    };
  } finally {
    db.close();
  }
}

export async function deleteUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = openDatabase();
    if (db) {
      try {
        db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash(token));
      } finally {
        db.close();
      }
    }
  }
  cookieStore.delete(SESSION_COOKIE);
}
