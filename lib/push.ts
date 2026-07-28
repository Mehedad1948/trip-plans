import "server-only";

import webpush from "web-push";

import { openDatabase } from "@/lib/database";

type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PushPayload = {
  tripSlug: string;
  excludeMemberId: number;
  title: string;
  body: string;
  url: string;
  tag: string;
};

function requiredDatabase() {
  const db = openDatabase();
  if (!db) {
    throw new Error("پایگاه داده آماده نیست. ابتدا npm run seed را اجرا کنید.");
  }
  return db;
}

function ensurePushSchema(
  db: NonNullable<ReturnType<typeof openDatabase>>,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
      ON push_subscriptions(user_id);
  `);
}

export function savePushSubscription(
  userId: number,
  subscription: StoredSubscription,
) {
  const db = requiredDatabase();
  try {
    ensurePushSchema(db);
    db.prepare(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         user_id = excluded.user_id,
         p256dh = excluded.p256dh,
         auth = excluded.auth,
         updated_at = CURRENT_TIMESTAMP`,
    ).run(
      userId,
      subscription.endpoint,
      subscription.p256dh,
      subscription.auth,
    );
  } finally {
    db.close();
  }
}

export function removePushSubscription(userId: number, endpoint: string) {
  const db = requiredDatabase();
  try {
    ensurePushSchema(db);
    db.prepare(
      "DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?",
    ).run(userId, endpoint);
  } finally {
    db.close();
  }
}

function pushConfiguration() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

export async function sendTripPushNotifications(payload: PushPayload) {
  const configuration = pushConfiguration();
  if (!configuration) return { sent: 0, skipped: true };

  const db = requiredDatabase();
  let subscriptions: StoredSubscription[];
  try {
    ensurePushSchema(db);
    subscriptions = db
      .prepare(
        `SELECT DISTINCT
           push_subscriptions.endpoint,
           push_subscriptions.p256dh,
           push_subscriptions.auth
         FROM push_subscriptions
         JOIN users ON users.id = push_subscriptions.user_id
         JOIN trip_members ON trip_members.user_id = users.id
         JOIN trips ON trips.id = trip_members.trip_id
         WHERE trips.slug = ? AND trip_members.id <> ?`,
      )
      .all(payload.tripSlug, payload.excludeMemberId)
      .map((row) => ({
        endpoint: String(row.endpoint),
        p256dh: String(row.p256dh),
        auth: String(row.auth),
      }));
  } finally {
    db.close();
  }

  if (!subscriptions.length) return { sent: 0, skipped: false };

  webpush.setVapidDetails(
    configuration.subject,
    configuration.publicKey,
    configuration.privateKey,
  );

  const staleEndpoints: string[] = [];
  let sent = 0;
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url,
            tag: payload.tag,
          }),
          { TTL: 60 * 60, urgency: "high" },
        );
        sent += 1;
      } catch (error) {
        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          typeof error.statusCode === "number"
            ? error.statusCode
            : undefined;

        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(subscription.endpoint);
          return;
        }
        console.error("Push notification delivery failed.", { statusCode });
      }
    }),
  );

  if (staleEndpoints.length) {
    const cleanupDb = requiredDatabase();
    try {
      ensurePushSchema(cleanupDb);
      const remove = cleanupDb.prepare(
        "DELETE FROM push_subscriptions WHERE endpoint = ?",
      );
      staleEndpoints.forEach((endpoint) => remove.run(endpoint));
    } finally {
      cleanupDb.close();
    }
  }

  return { sent, skipped: false };
}
