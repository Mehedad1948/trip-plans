import Link from "next/link";

import { Icon } from "@/components/icons";

export const metadata = {
  title: "اتصال اینترنت برقرار نیست",
};

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-white px-6 text-[#424874]">
      <section className="w-full max-w-md rounded-[2rem] border border-black/[0.06] bg-white p-8 text-center shadow-[0_20px_60px_rgba(66,72,116,0.08)] sm:p-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#F4EEFF]">
          <Icon name="route" className="size-6" />
        </span>
        <h1 className="mt-6 text-2xl font-bold">فعلاً آفلاین هستید</h1>
        <p className="mt-3 text-sm leading-7 text-[#6B7190]">
          برای دیدن تازه‌ترین پیام‌ها و هزینه‌ها، اتصال اینترنت را بررسی کنید و
          دوباره تلاش کنید.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-[#424874] px-5 text-sm font-semibold text-white"
        >
          تلاش دوباره
        </Link>
      </section>
    </main>
  );
}
