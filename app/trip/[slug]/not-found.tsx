import Link from "next/link";

import { Icon } from "@/components/icons";

export default function TripNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4EEFF] px-6 text-center">
      <div className="max-w-md rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_rgba(66,72,116,0.08)] sm:p-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#DCD6F7] text-[#424874]">
          <Icon name="map" className="size-7" />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-[#424874]">
          این سفر پیدا نشد
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#6B7190]">
          نشانی سفر را بررسی کنید یا برای دیدن سفر فعلی به صفحه اصلی برگردید.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[#424874] px-5 text-sm font-bold text-white outline-none transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#424874]"
        >
          رفتن به سفر فعلی
        </Link>
      </div>
    </main>
  );
}
