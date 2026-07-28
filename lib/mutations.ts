import "server-only";

import { openDatabase } from "@/lib/database";

function cleanText(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function requiredDatabase() {
  const db = openDatabase();
  if (!db) {
    throw new Error("پایگاه داده آماده نیست. ابتدا npm run seed را اجرا کنید.");
  }
  return db;
}

function getTripId(
  db: NonNullable<ReturnType<typeof openDatabase>>,
  tripSlug: string,
) {
  const row = db.prepare("SELECT id FROM trips WHERE slug = ?").get(tripSlug);
  if (!row) throw new Error("سفر پیدا نشد.");
  return Number(row.id);
}

function assertMember(
  db: NonNullable<ReturnType<typeof openDatabase>>,
  tripId: number,
  memberId: number,
) {
  const row = db
    .prepare("SELECT id FROM trip_members WHERE id = ? AND trip_id = ?")
    .get(memberId, tripId);
  if (!row) throw new Error("هم‌سفر انتخاب‌شده عضو این سفر نیست.");
}

export function togglePackingItem(
  tripSlug: string,
  memberId: number,
  itemId: number,
) {
  const db = requiredDatabase();
  try {
    const tripId = getTripId(db, tripSlug);
    assertMember(db, tripId, memberId);
    const result = db
      .prepare(
        `UPDATE packing_items
         SET is_packed = CASE is_packed WHEN 1 THEN 0 ELSE 1 END
         WHERE id = ?
           AND assigned_member_id = ?
           AND category_id IN (
             SELECT id FROM packing_categories WHERE trip_id = ?
           )`,
      )
      .run(itemId, memberId, tripId);
    if (result.changes !== 1) {
      throw new Error("این وسیله به هم‌سفر فعال تعلق ندارد.");
    }
  } finally {
    db.close();
  }
}

export function createPackingItem(input: {
  tripSlug: string;
  editorMemberId: number;
  categoryId: number;
  assignedMemberId: number;
  label: string;
}) {
  const db = requiredDatabase();
  try {
    const tripId = getTripId(db, input.tripSlug);
    assertMember(db, tripId, input.editorMemberId);
    assertMember(db, tripId, input.assignedMemberId);
    const category = db
      .prepare("SELECT id FROM packing_categories WHERE id = ? AND trip_id = ?")
      .get(input.categoryId, tripId);
    if (!category) throw new Error("دسته‌بندی نامعتبر است.");

    const label = cleanText(input.label, 120);
    if (!label) throw new Error("نام وسیله نمی‌تواند خالی باشد.");

    const orderRow = db
      .prepare(
        "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM packing_items WHERE category_id = ?",
      )
      .get(input.categoryId);
    db.prepare(
      `INSERT INTO packing_items (
         category_id, assigned_member_id, sort_order, label
       ) VALUES (?, ?, ?, ?)`,
    ).run(
      input.categoryId,
      input.assignedMemberId,
      Number(orderRow?.next_order ?? 0),
      label,
    );
  } finally {
    db.close();
  }
}

export function updatePackingItem(input: {
  tripSlug: string;
  editorMemberId: number;
  itemId: number;
  categoryId: number;
  assignedMemberId: number;
  label: string;
}) {
  const db = requiredDatabase();
  try {
    const tripId = getTripId(db, input.tripSlug);
    assertMember(db, tripId, input.editorMemberId);
    assertMember(db, tripId, input.assignedMemberId);
    const category = db
      .prepare("SELECT id FROM packing_categories WHERE id = ? AND trip_id = ?")
      .get(input.categoryId, tripId);
    if (!category) throw new Error("دسته‌بندی نامعتبر است.");

    const label = cleanText(input.label, 120);
    if (!label) throw new Error("نام وسیله نمی‌تواند خالی باشد.");

    const result = db
      .prepare(
        `UPDATE packing_items
         SET label = ?, category_id = ?, assigned_member_id = ?
         WHERE id = ?
           AND category_id IN (
             SELECT id FROM packing_categories WHERE trip_id = ?
           )`,
      )
      .run(
        label,
        input.categoryId,
        input.assignedMemberId,
        input.itemId,
        tripId,
      );
    if (result.changes !== 1) throw new Error("وسیله پیدا نشد.");
  } finally {
    db.close();
  }
}

export function deletePackingItem(
  tripSlug: string,
  editorMemberId: number,
  itemId: number,
) {
  const db = requiredDatabase();
  try {
    const tripId = getTripId(db, tripSlug);
    assertMember(db, tripId, editorMemberId);
    db.prepare(
      `DELETE FROM packing_items
       WHERE id = ?
         AND category_id IN (
           SELECT id FROM packing_categories WHERE trip_id = ?
         )`,
    ).run(itemId, tripId);
  } finally {
    db.close();
  }
}

export function createMessage(
  tripSlug: string,
  authorMemberId: number,
  bodyValue: string,
) {
  const db = requiredDatabase();
  try {
    const tripId = getTripId(db, tripSlug);
    assertMember(db, tripId, authorMemberId);
    const body = cleanText(bodyValue, 1000);
    if (!body) throw new Error("پیام نمی‌تواند خالی باشد.");
    db.prepare(
      "INSERT INTO messages (trip_id, author_member_id, body) VALUES (?, ?, ?)",
    ).run(tripId, authorMemberId, body);
    return body;
  } finally {
    db.close();
  }
}

export function createExpense(input: {
  tripSlug: string;
  recorderMemberId: number;
  payerMemberId: number;
  description: string;
  amount: number;
  participantMemberIds: number[];
}) {
  const db = requiredDatabase();
  try {
    const tripId = getTripId(db, input.tripSlug);
    assertMember(db, tripId, input.recorderMemberId);
    assertMember(db, tripId, input.payerMemberId);
    const participants = [...new Set(input.participantMemberIds)];
    if (!participants.length) throw new Error("حداقل یک نفر باید در هزینه شریک باشد.");
    participants.forEach((memberId) => assertMember(db, tripId, memberId));

    const description = cleanText(input.description, 160);
    const amount = Math.round(input.amount);
    if (!description) throw new Error("شرح هزینه نمی‌تواند خالی باشد.");
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error("مبلغ هزینه نامعتبر است.");
    }

    db.exec("BEGIN IMMEDIATE");
    try {
      const expense = db
        .prepare(
          `INSERT INTO expenses (
             trip_id, payer_member_id, recorded_by_member_id, description, amount
           ) VALUES (?, ?, ?, ?, ?)`,
        )
        .run(
          tripId,
          input.payerMemberId,
          input.recorderMemberId,
          description,
          amount,
        );
      const expenseId = Number(expense.lastInsertRowid);
      const baseShare = Math.floor(amount / participants.length);
      let remainder = amount % participants.length;
      const insertShare = db.prepare(
        `INSERT INTO expense_participants (
           expense_id, member_id, share_amount
         ) VALUES (?, ?, ?)`,
      );

      participants.forEach((memberId) => {
        const share = baseShare + (remainder > 0 ? 1 : 0);
        remainder = Math.max(0, remainder - 1);
        insertShare.run(expenseId, memberId, share);
      });
      db.exec("COMMIT");
      return { description, amount };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } finally {
    db.close();
  }
}

export function deleteExpense(
  tripSlug: string,
  recorderMemberId: number,
  expenseId: number,
) {
  const db = requiredDatabase();
  try {
    const tripId = getTripId(db, tripSlug);
    assertMember(db, tripId, recorderMemberId);
    db.prepare(
      "DELETE FROM expenses WHERE id = ? AND trip_id = ? AND recorded_by_member_id = ?",
    ).run(expenseId, tripId, recorderMemberId);
  } finally {
    db.close();
  }
}
