import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Icon } from "@/components/icons";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "ورود | برنامه سفر گروهی",
  description: "ورود هم‌سفران به برنامه سفر",
};

function safeDestination(value?: string) {
  return value?.startsWith("/trip/") && !value.startsWith("//") ? value : "/";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const destination = safeDestination((await searchParams).next);
  if (await getCurrentUser()) redirect(destination);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#424874] px-5 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(166,177,225,.32),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(220,214,247,.22),transparent_32%)]" />
      <section className="relative w-full max-w-md rounded-[2rem] bg-white p-6 shadow-[0_30px_90px_rgba(20,23,48,.28)] sm:p-9">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#DCD6F7] text-[#424874]">
          <Icon name="lock" className="size-7" />
        </span>
        <div className="mt-6 text-center">
          <p className="text-xs font-semibold text-[#6B7190]">از کویر تا مه</p>
          <h1 className="mt-1 text-2xl font-bold tracking-[-0.035em] text-[#424874]">
            ورود هم‌سفران
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#6B7190]">
            برای مشاهده و ویرایش برنامه با حساب خودتان وارد شوید.
          </p>
        </div>
        <LoginForm destination={destination} />
        <p className="mt-6 rounded-2xl bg-[#F4EEFF] px-4 py-3 text-center text-[11px] leading-6 text-[#6B7190]">
          حساب‌های اولیه: mehrdad، amir-mohammad و ali
          <br />
          رمز موقت همه حساب‌ها: <strong dir="ltr">123456</strong>
        </p>
      </section>
    </main>
  );
}
