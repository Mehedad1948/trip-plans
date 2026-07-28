"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, getTripMemberForUser } from "@/lib/auth";
import {
  createExpense,
  createMessage,
  createPackingItem,
  deleteExpense,
  deletePackingItem,
  togglePackingItem,
  updatePackingItem,
} from "@/lib/mutations";
import { sendTripPushNotifications } from "@/lib/push";

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function numberValue(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  if (!Number.isSafeInteger(value)) throw new Error(`Invalid ${key}.`);
  return value;
}

function tripSlug(formData: FormData) {
  const slug = stringValue(formData, "tripSlug");
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("Invalid trip slug.");
  return slug;
}

async function authenticatedMember(slug: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trip/${slug}`)}`);
  const member = await getTripMemberForUser(slug, user.id);
  if (!member) throw new Error("شما عضو این سفر نیستید.");
  return member;
}

function finish(slug: string, anchor: string) {
  revalidatePath(`/trip/${slug}`);
  redirect(`/trip/${slug}#${anchor}`);
}

async function notifyTrip(
  payload: Parameters<typeof sendTripPushNotifications>[0],
) {
  try {
    await sendTripPushNotifications(payload);
  } catch (error) {
    console.error("Could not send trip push notifications.", error);
  }
}

export async function togglePackingAction(formData: FormData) {
  const slug = tripSlug(formData);
  const member = await authenticatedMember(slug);
  await togglePackingItem(
    slug,
    member.id,
    numberValue(formData, "itemId"),
  );
  finish(slug, "packing");
}

export async function createPackingAction(formData: FormData) {
  const slug = tripSlug(formData);
  const member = await authenticatedMember(slug);
  await createPackingItem({
    tripSlug: slug,
    editorMemberId: member.id,
    categoryId: numberValue(formData, "categoryId"),
    assignedMemberId: numberValue(formData, "assignedMemberId"),
    label: stringValue(formData, "label"),
  });
  finish(slug, "packing");
}

export async function updatePackingAction(formData: FormData) {
  const slug = tripSlug(formData);
  const member = await authenticatedMember(slug);
  await updatePackingItem({
    tripSlug: slug,
    editorMemberId: member.id,
    itemId: numberValue(formData, "itemId"),
    categoryId: numberValue(formData, "categoryId"),
    assignedMemberId: numberValue(formData, "assignedMemberId"),
    label: stringValue(formData, "label"),
  });
  finish(slug, "packing");
}

export async function deletePackingAction(formData: FormData) {
  const slug = tripSlug(formData);
  const member = await authenticatedMember(slug);
  await deletePackingItem(
    slug,
    member.id,
    numberValue(formData, "itemId"),
  );
  finish(slug, "packing");
}

export async function createMessageAction(formData: FormData) {
  const slug = tripSlug(formData);
  const member = await authenticatedMember(slug);
  const body = await createMessage(
    slug,
    member.id,
    stringValue(formData, "body"),
  );
  await notifyTrip({
    tripSlug: slug,
    excludeMemberId: member.id,
    title: "پیام جدید سفر",
    body: `${member.displayName}: ${body.slice(0, 140)}`,
    url: `/trip/${slug}?panel=chat`,
    tag: `trip-${slug}-messages`,
  });
  if (stringValue(formData, "view") === "overlay") {
    revalidatePath(`/trip/${slug}`);
    redirect(`/trip/${slug}?panel=chat`);
  }
  finish(slug, "chat");
}

export async function createExpenseAction(formData: FormData) {
  const slug = tripSlug(formData);
  const member = await authenticatedMember(slug);
  const expense = await createExpense({
    tripSlug: slug,
    recorderMemberId: member.id,
    payerMemberId: numberValue(formData, "payerMemberId"),
    description: stringValue(formData, "description"),
    amount: numberValue(formData, "amount"),
    participantMemberIds: formData
      .getAll("participantMemberIds")
      .map(Number)
      .filter(Number.isSafeInteger),
  });
  await notifyTrip({
    tripSlug: slug,
    excludeMemberId: member.id,
    title: "هزینه جدید سفر",
    body: `${member.displayName} هزینه «${expense.description}» را ثبت کرد.`,
    url: `/trip/${slug}#expenses`,
    tag: `trip-${slug}-expenses`,
  });
  finish(slug, "expenses");
}

export async function deleteExpenseAction(formData: FormData) {
  const slug = tripSlug(formData);
  const member = await authenticatedMember(slug);
  await deleteExpense(
    slug,
    member.id,
    numberValue(formData, "expenseId"),
  );
  finish(slug, "expenses");
}
