import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync } from "node:crypto";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(projectRoot, "data", "trip.json");
const databasePath = join(projectRoot, "data", "trip.db");

function readSource() {
  try {
    const source = JSON.parse(readFileSync(sourcePath, "utf8"));
    if (
      !source.trip ||
      !Array.isArray(source.users) ||
      !Array.isArray(source.days)
    ) {
      throw new Error("The source must include `users`, `trip`, and `days`.");
    }
    return source;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read ${sourcePath}: ${message}`);
  }
}

mkdirSync(dirname(databasePath), { recursive: true });

const source = readSource();
const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA foreign_keys = OFF;
  DROP TABLE IF EXISTS push_subscriptions;
  DROP TABLE IF EXISTS sessions;
  DROP TABLE IF EXISTS expense_participants;
  DROP TABLE IF EXISTS expenses;
  DROP TABLE IF EXISTS messages;
  DROP TABLE IF EXISTS emergency_contacts;
  DROP TABLE IF EXISTS safety_tips;
  DROP TABLE IF EXISTS packing_items;
  DROP TABLE IF EXISTS packing_categories;
  DROP TABLE IF EXISTS foods;
  DROP TABLE IF EXISTS images;
  DROP TABLE IF EXISTS locations;
  DROP TABLE IF EXISTS activities;
  DROP TABLE IF EXISTS days;
  DROP TABLE IF EXISTS trip_members;
  DROP TABLE IF EXISTS trips;
  DROP TABLE IF EXISTS users;

  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE sessions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE push_subscriptions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE trips (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    start_location TEXT NOT NULL,
    end_location TEXT NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    route TEXT NOT NULL,
    total_distance INTEGER NOT NULL,
    total_drive_duration TEXT NOT NULL,
    best_season TEXT NOT NULL,
    hero_image TEXT NOT NULL,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE trip_members (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (trip_id, user_id)
  );

  CREATE TABLE days (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    weekday TEXT NOT NULL,
    title TEXT NOT NULL,
    overnight_city TEXT NOT NULL,
    summary TEXT NOT NULL,
    driving_distance INTEGER NOT NULL,
    driving_duration TEXT NOT NULL,
    UNIQUE (trip_id, day_number)
  );

  CREATE TABLE activities (
    id INTEGER PRIMARY KEY,
    day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    category TEXT NOT NULL,
    duration TEXT NOT NULL,
    UNIQUE (day_id, sort_order)
  );

  CREATE TABLE locations (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    province TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );

  CREATE TABLE images (
    id INTEGER PRIMARY KEY,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL
  );

  CREATE TABLE foods (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE packing_categories (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE packing_items (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES packing_categories(id) ON DELETE CASCADE,
    assigned_member_id INTEGER REFERENCES trip_members(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL,
    label TEXT NOT NULL,
    is_packed INTEGER NOT NULL DEFAULT 0 CHECK (is_packed IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    author_member_id INTEGER NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE expenses (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    payer_member_id INTEGER NOT NULL REFERENCES trip_members(id) ON DELETE RESTRICT,
    recorded_by_member_id INTEGER NOT NULL REFERENCES trip_members(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE expense_participants (
    expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
    share_amount INTEGER NOT NULL CHECK (share_amount >= 0),
    PRIMARY KEY (expense_id, member_id)
  );

  CREATE TABLE safety_tips (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    level TEXT NOT NULL
  );

  CREATE TABLE emergency_contacts (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    name TEXT NOT NULL,
    number TEXT NOT NULL
  );

  CREATE INDEX idx_trip_members_trip ON trip_members(trip_id);
  CREATE INDEX idx_sessions_token ON sessions(token_hash, expires_at);
  CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
  CREATE INDEX idx_days_trip ON days(trip_id, day_number);
  CREATE INDEX idx_activities_day ON activities(day_id, sort_order);
  CREATE INDEX idx_locations_trip ON locations(trip_id);
  CREATE INDEX idx_messages_trip ON messages(trip_id, created_at);
  CREATE INDEX idx_expenses_trip ON expenses(trip_id, created_at);
  CREATE INDEX idx_packing_assignee ON packing_items(assigned_member_id);
`);

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

const insertUser = db.prepare(
  "INSERT INTO users (slug, username, display_name, password_hash) VALUES (?, ?, ?, ?)",
);
const insertTrip = db.prepare(`
  INSERT INTO trips (
    slug, title, description, start_location, end_location, duration_days, route,
    total_distance, total_drive_duration, best_season, hero_image, metadata
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertMember = db.prepare(
  "INSERT INTO trip_members (trip_id, user_id, role) VALUES (?, ?, ?)",
);
const insertDay = db.prepare(`
  INSERT INTO days (
    trip_id, day_number, weekday, title, overnight_city, summary,
    driving_distance, driving_duration
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertActivity = db.prepare(`
  INSERT INTO activities (
    day_id, sort_order, time, title, description, location, category, duration
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertLocation = db.prepare(`
  INSERT INTO locations (
    trip_id, name, province, category, description, latitude, longitude
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertImage = db.prepare(
  "INSERT INTO images (location_id, title, url) VALUES (?, ?, ?)",
);
const insertFood = db.prepare(`
  INSERT INTO foods (trip_id, sort_order, name, city, description)
  VALUES (?, ?, ?, ?, ?)
`);
const insertPackingCategory = db.prepare(
  "INSERT INTO packing_categories (trip_id, sort_order, name) VALUES (?, ?, ?)",
);
const insertPackingItem = db.prepare(`
  INSERT INTO packing_items (
    category_id, assigned_member_id, sort_order, label
  ) VALUES (?, ?, ?, ?)
`);
const insertSafety = db.prepare(`
  INSERT INTO safety_tips (trip_id, sort_order, title, description, level)
  VALUES (?, ?, ?, ?, ?)
`);
const insertEmergency = db.prepare(`
  INSERT INTO emergency_contacts (trip_id, sort_order, name, number)
  VALUES (?, ?, ?, ?)
`);

try {
  db.exec("BEGIN IMMEDIATE");

  const userIds = new Map();
  for (const user of source.users) {
    const result = insertUser.run(
      user.slug,
      user.username ?? user.slug,
      user.name,
      hashPassword("123456"),
    );
    userIds.set(user.slug, Number(result.lastInsertRowid));
  }

  const tripResult = insertTrip.run(
    source.trip.slug,
    source.trip.title,
    source.trip.description,
    source.trip.startLocation,
    source.trip.endLocation,
    source.trip.durationDays,
    source.trip.route,
    source.trip.totalDistance,
    source.trip.totalDriveDuration,
    source.trip.bestSeason,
    source.trip.heroImage,
    JSON.stringify(source.trip.metadata ?? {}),
  );
  const tripId = Number(tripResult.lastInsertRowid);

  const memberIds = new Map();
  for (const member of source.trip.members) {
    const userId = userIds.get(member.userSlug);
    if (!userId) {
      throw new Error(`Unknown trip member: ${member.userSlug}`);
    }
    const result = insertMember.run(tripId, userId, member.role ?? "member");
    memberIds.set(member.userSlug, Number(result.lastInsertRowid));
  }

  for (const day of source.days) {
    const dayResult = insertDay.run(
      tripId,
      day.dayNumber,
      day.weekday,
      day.title,
      day.overnightCity,
      day.summary,
      day.drivingDistance,
      day.drivingDuration,
    );
    const dayId = Number(dayResult.lastInsertRowid);

    day.activities.forEach((activity, index) => {
      insertActivity.run(
        dayId,
        index,
        activity.time,
        activity.title,
        activity.description,
        activity.location,
        activity.category,
        activity.duration,
      );
    });
  }

  source.locations.forEach((location) => {
    const locationResult = insertLocation.run(
      tripId,
      location.name,
      location.province,
      location.category,
      location.description,
      location.latitude,
      location.longitude,
    );
    insertImage.run(
      Number(locationResult.lastInsertRowid),
      location.image.title,
      location.image.url,
    );
  });

  source.foods.forEach((food, index) => {
    insertFood.run(tripId, index, food.name, food.city, food.description);
  });

  source.packing.forEach((category, categoryIndex) => {
    const result = insertPackingCategory.run(tripId, categoryIndex, category.category);
    const categoryId = Number(result.lastInsertRowid);
    category.items.forEach((item, itemIndex) => {
      const memberId = memberIds.get(item.assignedTo);
      if (!memberId) {
        throw new Error(`Unknown packing assignee: ${item.assignedTo}`);
      }
      insertPackingItem.run(categoryId, memberId, itemIndex, item.label);
    });
  });

  source.safety.forEach((tip, index) => {
    insertSafety.run(tripId, index, tip.title, tip.description, tip.level);
  });

  source.emergency.forEach((contact, index) => {
    insertEmergency.run(tripId, index, contact.name, contact.number);
  });

  db.exec("COMMIT");
  console.log(
    `Seeded "${source.trip.title}" with ${memberIds.size} members into ${databasePath}`,
  );
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
