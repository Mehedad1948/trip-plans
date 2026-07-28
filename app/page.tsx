import { redirect } from "next/navigation";

import { getDefaultTripSlug } from "@/lib/db";

export default function Home() {
  const slug = getDefaultTripSlug();

  if (!slug) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4EEFF] px-6 text-center">
        <div className="max-w-md rounded-[2rem] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-[#424874]">
            هنوز سفری ثبت نشده است
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#6B7190]">
            برای ساخت داده اولیه، دستور npm run seed را اجرا کنید.
          </p>
        </div>
      </main>
    );
  }

  redirect(`/trip/${slug}`);
}
