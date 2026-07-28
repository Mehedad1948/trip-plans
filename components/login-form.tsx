"use client";

import { useActionState } from "react";

import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { loginAction, type LoginState } from "@/app/login/actions";

const initialState: LoginState = { error: "" };

export function LoginForm({ destination }: { destination: string }) {
  const [state, action] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={destination} />
      <label className="block text-right">
        <span className="mb-2 block text-xs font-semibold text-[#6B7190]">
          نام کاربری
        </span>
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          required
          className="h-12 w-full rounded-2xl border border-[#DCD6F7] bg-[#F4EEFF] px-4 text-left text-sm text-[#424874] outline-none transition-shadow focus:border-[#A6B1E1] focus:ring-4 focus:ring-[#DCD6F7]/70"
          dir="ltr"
          placeholder="mehrdad"
        />
      </label>
      <label className="block text-right">
        <span className="mb-2 block text-xs font-semibold text-[#6B7190]">
          رمز عبور
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 w-full rounded-2xl border border-[#DCD6F7] bg-[#F4EEFF] px-4 text-left text-sm text-[#424874] outline-none transition-shadow focus:border-[#A6B1E1] focus:ring-4 focus:ring-[#DCD6F7]/70"
          dir="ltr"
          placeholder="••••••"
        />
      </label>
      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-[#fff0ec] px-4 py-3 text-right text-xs font-medium text-[#9b4e3a]"
        >
          {state.error}
        </p>
      )}
      <SubmitButton
        pendingLabel="در حال ورود…"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#424874] text-sm font-bold text-white outline-none transition-transform active:scale-[0.98] disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#424874] focus-visible:ring-offset-2"
      >
        <Icon name="login" className="size-5" />
        ورود به برنامه سفر
      </SubmitButton>
    </form>
  );
}
