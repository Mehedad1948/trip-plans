import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(projectRoot, "data", "trip.json");
const databasePath = join(projectRoot, "data", "trip.db");

function readSource() {
  try {
    const source = JSON.parse(readFileSync(sourcePath, "utf8"));

    if (!source.trip || !Array.isArray(source.days)) {
      throw new Error("The source must include `trip` and `days`.");
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
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY,
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
    metadata TEXT NOT NULL DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS days (
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

  CREATE TABLE IF NOT EXISTS activities (
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

  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    province TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS packing_categories (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS packing_items (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES packing_categories(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    label TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS safety_tips (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    level TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS emergency_contacts (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    name TEXT NOT NULL,
    number TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_days_trip ON days(trip_id, day_number);
  CREATE INDEX IF NOT EXISTS idx_activities_day ON activities(day_id, sort_order);
  CREATE INDEX IF NOT EXISTS idx_locations_trip ON locations(trip_id);
`);

const seed = db.prepare(`
  INSERT INTO trips (
    title, description, start_location, end_location, duration_days, route,
    total_distance, total_drive_duration, best_season, hero_image, metadata
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
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
const insertImage = db.prepare(`
  INSERT INTO images (location_id, title, url) VALUES (?, ?, ?)
`);
const insertFood = db.prepare(`
  INSERT INTO foods (trip_id, sort_order, name, city, description)
  VALUES (?, ?, ?, ?, ?)
`);
const insertPackingCategory = db.prepare(`
  INSERT INTO packing_categories (trip_id, sort_order, name) VALUES (?, ?, ?)
`);
const insertPackingItem = db.prepare(`
  INSERT INTO packing_items (category_id, sort_order, label) VALUES (?, ?, ?)
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
  db.exec(`
    DELETE FROM emergency_contacts;
    DELETE FROM safety_tips;
    DELETE FROM packing_items;
    DELETE FROM packing_categories;
    DELETE FROM foods;
    DELETE FROM images;
    DELETE FROM locations;
    DELETE FROM activities;
    DELETE FROM days;
    DELETE FROM trips;
  `);

  const tripResult = seed.run(
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
    category.items.forEach((label, itemIndex) => {
      insertPackingItem.run(categoryId, itemIndex, label);
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
    `Seeded "${source.trip.title}" (${source.days.length} days) into ${databasePath}`,
  );
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
