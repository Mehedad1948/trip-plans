import "server-only";

import type { Client, Transaction } from "@libsql/client";

import { getDatabase } from "@/lib/database";

type DatabaseExecutor = Pick<Client, "execute"> | Pick<Transaction, "execute">;

function cleanText(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

async function getTripId(executor: DatabaseExecutor, tripSlug: string) {
  const result = await executor.execute({
    sql: "SELECT id FROM trips WHERE slug = ?",
    args: [tripSlug],
  });
  const row = result.rows[0];
  if (!row) throw new Error("سفر پیدا نشد.");
  return Number(row.id);
}

async function assertMember(
  executor: DatabaseExecutor,
  tripId: number,
  memberId: number,
) {
  const result = await executor.execute({
    sql: "SELECT id FROM trip_members WHERE id = ? AND trip_id = ?",
    args: [memberId, tripId],
  });
  if (!result.rows[0]) {
    throw new Error("هم‌سفر انتخاب‌شده عضو این سفر نیست.");
  }
}

export async function togglePackingItem(
  tripSlug: string,
  memberId: number,
  itemId: number,
) {
  const db = getDatabase();
  const tripId = await getTripId(db, tripSlug);
  await assertMember(db, tripId, memberId);
  const result = await db.execute({
    sql: `UPDATE packing_items
          SET is_packed = CASE is_packed WHEN 1 THEN 0 ELSE 1 END
          WHERE id = ?
            AND assigned_member_id = ?
            AND category_id IN (
              SELECT id FROM packing_categories WHERE trip_id = ?
            )`,
    args: [itemId, memberId, tripId],
  });
  if (result.rowsAffected !== 1) {
    throw new Error("این وسیله به هم‌سفر فعال تعلق ندارد.");
  }
}

export async function createPackingItem(input: {
  tripSlug: string;
  editorMemberId: number;
  categoryId: number;
  assignedMemberId: number;
  label: string;
}) {
  const label = cleanText(input.label, 120);
  if (!label) throw new Error("نام وسیله نمی‌تواند خالی باشد.");

  const transaction = await getDatabase().transaction("write");
  try {
    const tripId = await getTripId(transaction, input.tripSlug);
    await assertMember(transaction, tripId, input.editorMemberId);
    await assertMember(transaction, tripId, input.assignedMemberId);
    const categoryResult = await transaction.execute({
      sql: "SELECT id FROM packing_categories WHERE id = ? AND trip_id = ?",
      args: [input.categoryId, tripId],
    });
    if (!categoryResult.rows[0]) throw new Error("دسته‌بندی نامعتبر است.");

    const orderResult = await transaction.execute({
      sql: `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
            FROM packing_items WHERE category_id = ?`,
      args: [input.categoryId],
    });
    await transaction.execute({
      sql: `INSERT INTO packing_items (
              category_id, assigned_member_id, sort_order, label
            ) VALUES (?, ?, ?, ?)`,
      args: [
        input.categoryId,
        input.assignedMemberId,
        Number(orderResult.rows[0]?.next_order ?? 0),
        label,
      ],
    });
    await transaction.commit();
  } catch (error) {
    if (!transaction.closed) await transaction.rollback();
    throw error;
  } finally {
    transaction.close();
  }
}

export async function updatePackingItem(input: {
  tripSlug: string;
  editorMemberId: number;
  itemId: number;
  categoryId: number;
  assignedMemberId: number;
  label: string;
}) {
  const label = cleanText(input.label, 120);
  if (!label) throw new Error("نام وسیله نمی‌تواند خالی باشد.");

  const db = getDatabase();
  const tripId = await getTripId(db, input.tripSlug);
  await assertMember(db, tripId, input.editorMemberId);
  await assertMember(db, tripId, input.assignedMemberId);
  const categoryResult = await db.execute({
    sql: "SELECT id FROM packing_categories WHERE id = ? AND trip_id = ?",
    args: [input.categoryId, tripId],
  });
  if (!categoryResult.rows[0]) throw new Error("دسته‌بندی نامعتبر است.");

  const result = await db.execute({
    sql: `UPDATE packing_items
          SET label = ?, category_id = ?, assigned_member_id = ?
          WHERE id = ?
            AND category_id IN (
              SELECT id FROM packing_categories WHERE trip_id = ?
            )`,
    args: [
      label,
      input.categoryId,
      input.assignedMemberId,
      input.itemId,
      tripId,
    ],
  });
  if (result.rowsAffected !== 1) throw new Error("وسیله پیدا نشد.");
}

export async function deletePackingItem(
  tripSlug: string,
  editorMemberId: number,
  itemId: number,
) {
  const db = getDatabase();
  const tripId = await getTripId(db, tripSlug);
  await assertMember(db, tripId, editorMemberId);
  await db.execute({
    sql: `DELETE FROM packing_items
          WHERE id = ?
            AND category_id IN (
              SELECT id FROM packing_categories WHERE trip_id = ?
            )`,
    args: [itemId, tripId],
  });
}

export async function createMessage(
  tripSlug: string,
  authorMemberId: number,
  bodyValue: string,
) {
  const db = getDatabase();
  const tripId = await getTripId(db, tripSlug);
  await assertMember(db, tripId, authorMemberId);
  const body = cleanText(bodyValue, 1000);
  if (!body) throw new Error("پیام نمی‌تواند خالی باشد.");
  await db.execute({
    sql: "INSERT INTO messages (trip_id, author_member_id, body) VALUES (?, ?, ?)",
    args: [tripId, authorMemberId, body],
  });
  return body;
}

export async function createExpense(input: {
  tripSlug: string;
  recorderMemberId: number;
  payerMemberId: number;
  description: string;
  amount: number;
  participantMemberIds: number[];
}) {
  const participants = [...new Set(input.participantMemberIds)];
  if (!participants.length) {
    throw new Error("حداقل یک نفر باید در هزینه شریک باشد.");
  }

  const description = cleanText(input.description, 160);
  const amount = Math.round(input.amount);
  if (!description) throw new Error("شرح هزینه نمی‌تواند خالی باشد.");
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("مبلغ هزینه نامعتبر است.");
  }

  const transaction = await getDatabase().transaction("write");
  try {
    const tripId = await getTripId(transaction, input.tripSlug);
    await assertMember(transaction, tripId, input.recorderMemberId);
    await assertMember(transaction, tripId, input.payerMemberId);
    for (const memberId of participants) {
      await assertMember(transaction, tripId, memberId);
    }

    const expense = await transaction.execute({
      sql: `INSERT INTO expenses (
              trip_id, payer_member_id, recorded_by_member_id, description, amount
            ) VALUES (?, ?, ?, ?, ?)`,
      args: [
        tripId,
        input.payerMemberId,
        input.recorderMemberId,
        description,
        amount,
      ],
    });
    const expenseId = Number(expense.lastInsertRowid);
    const baseShare = Math.floor(amount / participants.length);
    let remainder = amount % participants.length;
    const shareStatements = participants.map((memberId) => {
      const share = baseShare + (remainder > 0 ? 1 : 0);
      remainder = Math.max(0, remainder - 1);
      return {
        sql: `INSERT INTO expense_participants (
                expense_id, member_id, share_amount
              ) VALUES (?, ?, ?)`,
        args: [expenseId, memberId, share],
      };
    });
    await transaction.batch(shareStatements);
    await transaction.commit();
    return { description, amount };
  } catch (error) {
    if (!transaction.closed) await transaction.rollback();
    throw error;
  } finally {
    transaction.close();
  }
}

export async function deleteExpense(
  tripSlug: string,
  recorderMemberId: number,
  expenseId: number,
) {
  const db = getDatabase();
  const tripId = await getTripId(db, tripSlug);
  await assertMember(db, tripId, recorderMemberId);
  await db.execute({
    sql: `DELETE FROM expenses
          WHERE id = ? AND trip_id = ? AND recorded_by_member_id = ?`,
    args: [expenseId, tripId, recorderMemberId],
  });
}
