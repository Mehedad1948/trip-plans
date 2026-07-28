"use server";

import { redirect } from "next/navigation";

import {
  authenticateUser,
  createUserSession,
  deleteUserSession,
} from "@/lib/auth";

export type LoginState = { error: string };

function safeDestination(value: FormDataEntryValue | null) {
  const destination = String(value ?? "/");
  return destination.startsWith("/trip/") && !destination.startsWith("//")
    ? destination
    : "/";
}

export async function loginAction(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!username.trim() || !password) {
    return { error: "نام کاربری و رمز عبور را وارد کنید." };
  }

  const user = authenticateUser(username, password);
  if (!user) return { error: "نام کاربری یا رمز عبور درست نیست." };

  await createUserSession(user.id);
  redirect(safeDestination(formData.get("next")));
}

export async function logoutAction() {
  await deleteUserSession();
  redirect("/login");
}
