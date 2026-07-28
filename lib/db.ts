import "server-only";

import { openDatabase } from "@/lib/database";
import type {
  Activity,
  ChatMessage,
  EmergencyContact,
  Expense,
  Food,
  Location,
  MemberBalance,
  PackingCategory,
  SafetyTip,
  Settlement,
  TripDay,
  TripMember,
  TripPlan,
} from "@/lib/types";

type Row = Record<string, unknown>;

function text(row: Row, key: string) {
  return String(row[key] ?? "");
}

function number(row: Row, key: string) {
  return Number(row[key] ?? 0);
}

function memberFromRow(row: Row, prefix = ""): TripMember {
  return {
    id: number(row, `${prefix}member_id`),
    userId: number(row, `${prefix}user_id`),
    slug: text(row, `${prefix}user_slug`),
    displayName: text(row, `${prefix}display_name`),
    role: text(row, `${prefix}role`),
  };
}

function calculateSettlements(balances: MemberBalance[]): Settlement[] {
  const debtors = balances
    .filter((item) => item.balance < 0)
    .map((item) => ({ member: item.member, amount: -item.balance }));
  const creditors = balances
    .filter((item) => item.balance > 0)
    .map((item) => ({ member: item.member, amount: item.balance }));
  const settlements: Settlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      settlements.push({
        from: debtor.member,
        to: creditor.member,
        amount,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) debtorIndex += 1;
    if (creditor.amount === 0) creditorIndex += 1;
  }

  return settlements;
}

export function getDefaultTripSlug() {
  const db = openDatabase();
  if (!db) return null;

  try {
    const row = db.prepare("SELECT slug FROM trips ORDER BY id LIMIT 1").get();
    return row ? text(row, "slug") : null;
  } finally {
    db.close();
  }
}

export function getTripPlanBySlug(slug: string): TripPlan | null {
  const db = openDatabase();
  if (!db) return null;

  try {
    const trip = db.prepare("SELECT * FROM trips WHERE slug = ? LIMIT 1").get(slug);
    if (!trip) return null;

    const tripId = number(trip, "id");
    const memberRows = db
      .prepare(
        `SELECT
           trip_members.id AS member_id,
           trip_members.role,
           users.id AS user_id,
           users.slug AS user_slug,
           users.display_name
         FROM trip_members
         JOIN users ON users.id = trip_members.user_id
         WHERE trip_members.trip_id = ?
         ORDER BY trip_members.id`,
      )
      .all(tripId);
    const members = memberRows.map((row) => memberFromRow(row));

    const activityStatement = db.prepare(
      "SELECT * FROM activities WHERE day_id = ? ORDER BY sort_order",
    );
    const days: TripDay[] = db
      .prepare("SELECT * FROM days WHERE trip_id = ? ORDER BY day_number")
      .all(tripId)
      .map((day) => ({
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
      "SELECT * FROM packing_items WHERE category_id = ? ORDER BY sort_order, id",
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
          isPacked: number(item, "is_packed") === 1,
          assignedMemberId: item.assigned_member_id
            ? number(item, "assigned_member_id")
            : null,
        })),
      }));

    const messages: ChatMessage[] = db
      .prepare(
        `SELECT
           messages.*,
           trip_members.id AS member_id,
           trip_members.role,
           users.id AS user_id,
           users.slug AS user_slug,
           users.display_name
         FROM messages
         JOIN trip_members ON trip_members.id = messages.author_member_id
         JOIN users ON users.id = trip_members.user_id
         WHERE messages.trip_id = ?
         ORDER BY messages.created_at, messages.id`,
      )
      .all(tripId)
      .map((message) => ({
        id: number(message, "id"),
        body: text(message, "body"),
        createdAt: text(message, "created_at"),
        author: memberFromRow(message),
      }));

    const participantStatement = db.prepare(
      `SELECT
         expense_participants.member_id,
         expense_participants.share_amount,
         users.display_name
       FROM expense_participants
       JOIN trip_members ON trip_members.id = expense_participants.member_id
       JOIN users ON users.id = trip_members.user_id
       WHERE expense_participants.expense_id = ?
       ORDER BY expense_participants.member_id`,
    );
    const expenses: Expense[] = db
      .prepare(
        `SELECT
           expenses.*,
           trip_members.id AS member_id,
           trip_members.role,
           users.id AS user_id,
           users.slug AS user_slug,
           users.display_name,
           recorder.id AS recorder_member_id,
           recorder.role AS recorder_role,
           recorder_user.id AS recorder_user_id,
           recorder_user.slug AS recorder_user_slug,
           recorder_user.display_name AS recorder_display_name
         FROM expenses
         JOIN trip_members ON trip_members.id = expenses.payer_member_id
         JOIN users ON users.id = trip_members.user_id
         JOIN trip_members AS recorder
           ON recorder.id = expenses.recorded_by_member_id
         JOIN users AS recorder_user ON recorder_user.id = recorder.user_id
         WHERE expenses.trip_id = ?
         ORDER BY expenses.created_at DESC, expenses.id DESC`,
      )
      .all(tripId)
      .map((expense) => ({
        id: number(expense, "id"),
        description: text(expense, "description"),
        amount: number(expense, "amount"),
        createdAt: text(expense, "created_at"),
        payer: memberFromRow(expense),
        recordedBy: memberFromRow(expense, "recorder_"),
        participants: participantStatement
          .all(number(expense, "id"))
          .map((participant) => ({
            memberId: number(participant, "member_id"),
            displayName: text(participant, "display_name"),
            shareAmount: number(participant, "share_amount"),
          })),
      }));

    const balances: MemberBalance[] = members.map((member) => {
      const paid = expenses
        .filter((expense) => expense.payer.id === member.id)
        .reduce((sum, expense) => sum + expense.amount, 0);
      const owed = expenses
        .flatMap((expense) => expense.participants)
        .filter((participant) => participant.memberId === member.id)
        .reduce((sum, participant) => sum + participant.shareAmount, 0);
      return { member, paid, owed, balance: paid - owed };
    });

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
      slug: text(trip, "slug"),
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
      members,
      days,
      locations,
      foods,
      packing,
      messages,
      expenses,
      balances,
      settlements: calculateSettlements(balances),
      safety,
      emergency,
    };
  } finally {
    db.close();
  }
}
