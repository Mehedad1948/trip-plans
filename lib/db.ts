import "server-only";

import { existsSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type {
  Activity,
  EmergencyContact,
  Food,
  Location,
  PackingCategory,
  SafetyTip,
  TripDay,
  TripPlan,
} from "@/lib/types";

const databasePath = join(process.cwd(), "data", "trip.db");

type Row = Record<string, unknown>;

function text(row: Row, key: string) {
  return String(row[key] ?? "");
}

function number(row: Row, key: string) {
  return Number(row[key] ?? 0);
}

export function getTripPlan(): TripPlan | null {
  if (!existsSync(databasePath)) {
    return null;
  }

  const db = new DatabaseSync(databasePath);

  try {
    const trip = db.prepare("SELECT * FROM trips ORDER BY id LIMIT 1").get();

    if (!trip) {
      return null;
    }

    const tripId = number(trip, "id");
    const dayRows = db
      .prepare("SELECT * FROM days WHERE trip_id = ? ORDER BY day_number")
      .all(tripId);
    const activityStatement = db.prepare(
      "SELECT * FROM activities WHERE day_id = ? ORDER BY sort_order",
    );

    const days: TripDay[] = dayRows.map((day) => ({
      id: number(day, "id"),
      dayNumber: number(day, "day_number"),
      weekday: text(day, "weekday"),
      title: text(day, "title"),
      overnightCity: text(day, "overnight_city"),
      summary: text(day, "summary"),
      drivingDistance: number(day, "driving_distance"),
      drivingDuration: text(day, "driving_duration"),
      activities: activityStatement
        .all(number(day, "id"))
        .map(
          (activity): Activity => ({
            id: number(activity, "id"),
            time: text(activity, "time"),
            title: text(activity, "title"),
            description: text(activity, "description"),
            location: text(activity, "location"),
            category: text(activity, "category"),
            duration: text(activity, "duration"),
          }),
        ),
    }));

    const locations: Location[] = db
      .prepare(
        `SELECT locations.*, images.title AS image_title, images.url AS image_url
         FROM locations
         LEFT JOIN images ON images.location_id = locations.id
         WHERE locations.trip_id = ?
         ORDER BY locations.id`,
      )
      .all(tripId)
      .map((location) => ({
        id: number(location, "id"),
        name: text(location, "name"),
        province: text(location, "province"),
        category: text(location, "category"),
        description: text(location, "description"),
        latitude: number(location, "latitude"),
        longitude: number(location, "longitude"),
        imageTitle: text(location, "image_title"),
        imageUrl: text(location, "image_url"),
      }));

    const foods: Food[] = db
      .prepare("SELECT * FROM foods WHERE trip_id = ? ORDER BY sort_order")
      .all(tripId)
      .map((food) => ({
        id: number(food, "id"),
        name: text(food, "name"),
        city: text(food, "city"),
        description: text(food, "description"),
      }));

    const itemStatement = db.prepare(
      "SELECT * FROM packing_items WHERE category_id = ? ORDER BY sort_order",
    );
    const packing: PackingCategory[] = db
      .prepare(
        "SELECT * FROM packing_categories WHERE trip_id = ? ORDER BY sort_order",
      )
      .all(tripId)
      .map((category) => ({
        id: number(category, "id"),
        name: text(category, "name"),
        items: itemStatement.all(number(category, "id")).map((item) => ({
          id: number(item, "id"),
          label: text(item, "label"),
        })),
      }));

    const safety: SafetyTip[] = db
      .prepare("SELECT * FROM safety_tips WHERE trip_id = ? ORDER BY sort_order")
      .all(tripId)
      .map((tip) => ({
        id: number(tip, "id"),
        title: text(tip, "title"),
        description: text(tip, "description"),
        level: text(tip, "level"),
      }));

    const emergency: EmergencyContact[] = db
      .prepare(
        "SELECT * FROM emergency_contacts WHERE trip_id = ? ORDER BY sort_order",
      )
      .all(tripId)
      .map((contact) => ({
        id: number(contact, "id"),
        name: text(contact, "name"),
        number: text(contact, "number"),
      }));

    let metadata: TripPlan["metadata"] = {};
    try {
      metadata = JSON.parse(text(trip, "metadata")) as TripPlan["metadata"];
    } catch {
      metadata = {};
    }

    return {
      id: tripId,
      title: text(trip, "title"),
      description: text(trip, "description"),
      startLocation: text(trip, "start_location"),
      endLocation: text(trip, "end_location"),
      durationDays: number(trip, "duration_days"),
      route: text(trip, "route"),
      totalDistance: number(trip, "total_distance"),
      totalDriveDuration: text(trip, "total_drive_duration"),
      bestSeason: text(trip, "best_season"),
      heroImage: text(trip, "hero_image"),
      metadata,
      days,
      locations,
      foods,
      packing,
      safety,
      emergency,
    };
  } finally {
    db.close();
  }
}
