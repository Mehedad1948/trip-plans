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
  const member = getTripMemberForUser(slug, user.id);
  if (!member) throw new Error("شما عضو این سفر نیستید.");
  return member;
}

function finish(slug: string, anchor: string) {
  revalidatePath(`/trip/${slug}`);
  redirect(`/trip/${slug}#${anchor}`);
}

export async function togglePackingAction(formData: FormData) {
  const slug = tripSlug(formData);
  const member = await authenticatedMember(slug);
  togglePackingItem(
    slug,
    member.id,
    numberValue(formData, "itemId"),
  );
  finish(slug, "packing");
}

export async function createPackingAction(formData: FormData) {
  const slug = tripSlug(formData);
  const member = await authenticatedMember(slug);
  createPackingItem({
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
  updatePackingItem({
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
  deletePackingItem(
    slug,
    member.id,
    numberValue(formData, "itemId"),
  );
  finish(slug, "packing");
}

export async function createMessageAction(formData: FormData) {
  const slug = tripSlug(formData);
  const member = await authenticatedMember(slug);
  createMessage(
    slug,
    member.id,
    stringValue(formData, "body"),
  );
  if (stringValue(formData, "view") === "overlay") {
    revalidatePath(`/trip/${slug}`);
    redirect(`/trip/${slug}?panel=chat`);
  }
  finish(slug, "chat");
}

export async function createExpenseAction(formData: FormData) {
  const slug = tripSlug(formData);
  const member = await authenticatedMember(slug);
  createExpense({
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
  finish(slug, "expenses");
}

export async function deleteExpenseAction(formData: FormData) {
  const slug = tripSlug(formData);
  const member = await authenticatedMember(slug);
  deleteExpense(
    slug,
    member.id,
    numberValue(formData, "expenseId"),
  );
  finish(slug, "expenses");
}
