import { Suspense, type ComponentProps, type ReactNode } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Icon } from "@/components/icons";
import { SafeImage } from "@/components/safe-image";
import { PushNotificationControl } from "@/components/push-notification-control";
import { TripChrome } from "@/components/trip-chrome";
import { getCurrentUser, getTripMemberForUser } from "@/lib/auth";
import { getTripPlanBySlug } from "@/lib/db";
import type { TripMember, TripPlan } from "@/lib/types";
import { logoutAction } from "@/app/login/actions";
import { ChatPanel, CollaborationHub } from "./collaboration-hub";

const faNumber = new Intl.NumberFormat("fa-IR");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plan = await loadPlanSafely(slug);

  if (!plan) {
    return { title: "سفر پیدا نشد" };
  }

  return {
    title: `${plan.title} | برنامه سفر گروهی`,
    description: plan.description,
  };
}

function SectionHeading({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentProps<typeof Icon>["name"];
}) {
  return (
    <div className="mb-8 flex items-start gap-4 sm:mb-10">
      <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#DCD6F7] text-[#424874]">
        <Icon name={icon} className="size-5" />
      </span>
      <div>
        <p className="mb-1 text-xs font-semibold tracking-wide text-[#424874]">
          {eyebrow}
        </p>
        <h2
          id={title.replaceAll(" ", "-")}
          className="text-2xl font-bold tracking-[-0.035em] text-[#424874] sm:text-3xl"
        >
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6B7190] sm:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  children,
}: {
  icon: ComponentProps<typeof Icon>["name"];
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-inset ring-white/10 backdrop-blur-sm sm:p-5">
      <div className="mb-4 flex size-9 items-center justify-center rounded-xl bg-white/10 text-white/80">
        <Icon name={icon} className="size-4.5" />
      </div>
      <div className="text-lg font-semibold tracking-[-0.02em] text-white">
        {children}
      </div>
      <div className="mt-1 text-xs text-white/55">{label}</div>
    </div>
  );
}

function TravelPage({
  plan,
  activeMember,
}: {
  plan: TripPlan;
  activeMember: TripMember;
}) {
  const routeStops = plan.route.split("←").map((stop) => stop.trim());

  return (
    <main className="overflow-clip bg-white pb-24 text-[#424874] lg:pb-0">
      <nav
        aria-label="دسترسی سریع"
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-2xl bg-[#F4EEFF]/85 px-4 shadow-[0_10px_35px_rgba(66,72,116,0.12)] ring-1 ring-black/5 backdrop-blur-xl sm:px-5">
          <a
            href="#top"
            className="flex items-center gap-2 rounded-xl font-bold text-[#424874] outline-none transition-transform active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#424874]"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#424874] text-white">
              <Icon name="compass" className="size-4.5" />
            </span>
            <span className="hidden sm:inline">از کویر تا مه</span>
          </a>
          <div className="hidden items-center gap-1 text-xs font-medium text-[#6B7190] md:flex">
            <a className="nav-link" href="#program">
              برنامه روزها
            </a>
            <a className="nav-link" href="#team">
              هم‌سفرها
            </a>
            <a className="nav-link" href="#packing">
              وسایل
            </a>
            <a className="nav-link" href="#expenses">
              هزینه‌ها
            </a>
            <a className="nav-link" href="?panel=chat">
              گفتگو
            </a>
            <a className="nav-link" href="#safety">
              ایمنی
            </a>
          </div>
          <div className="flex items-center gap-2">
            <PushNotificationControl />
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#424874] px-3 text-xs font-semibold text-white outline-none transition-transform active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#424874] focus-visible:ring-offset-2"
                title={`خروج از حساب ${activeMember.displayName}`}
              >
                <span className="hidden sm:inline">{activeMember.displayName}</span>
                <Icon name="logout" className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </nav>

      <Suspense fallback={null}>
        <TripChrome
          chatPanel={
            <ChatPanel
              plan={plan}
              activeMember={activeMember}
              view="overlay"
            />
          }
        />
      </Suspense>

      <header id="top" className="relative min-h-[760px] bg-[#424874] text-white">
        <SafeImage
          src={plan.heroImage}
          alt="چشم‌انداز سرسبز مسیر سفر"
          fill
          preload
          sizes="100vw"
          className="object-cover"
          fallbackLabel="چشم‌انداز سفر"
          quietFallback
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,29,58,.4),rgba(26,29,58,.22)),linear-gradient(0deg,rgba(26,29,58,.96)_0%,rgba(26,29,58,.58)_50%,rgba(26,29,58,.22)_100%)]" />
        <div className="relative mx-auto flex min-h-[760px] max-w-7xl flex-col justify-end px-5 pb-10 pt-28 sm:px-8 sm:pb-14 lg:px-10">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-medium text-white/85 ring-1 ring-inset ring-white/15 backdrop-blur-md">
              <Icon name="spark" className="size-4 text-[#A6B1E1]" />
              {plan.metadata.travelStyle ?? "سفر جاده‌ای"}
              <span className="size-1 rounded-full bg-white/40" />
              {plan.bestSeason}
            </div>
            <h1 className="max-w-3xl text-[clamp(2.8rem,8vw,6.7rem)] font-bold leading-[1.08] tracking-[-0.055em] text-balance">
              {plan.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/75 sm:text-lg sm:leading-9">
              {plan.description}
            </p>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon="calendar" label="مدت سفر">
              {faNumber.format(plan.durationDays)} روز
            </Stat>
            <Stat icon="route" label="مسافت تقریبی">
              {faNumber.format(plan.totalDistance)} کیلومتر
            </Stat>
            <Stat icon="clock" label="زمان رانندگی">
              {plan.totalDriveDuration}
            </Stat>
            <Stat icon="pin" label="شروع و پایان">
              {plan.startLocation} ← {plan.endLocation}
            </Stat>
          </div>
        </div>
      </header>

      <section
        aria-label="مسیر کلی سفر"
        className="border-b border-[#DCD6F7] bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none sm:flex-wrap sm:overflow-visible sm:pb-0">
            {routeStops.map((stop, index) => (
              <div key={`${stop}-${index}`} className="flex shrink-0 items-center">
                <span
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${
                    index === 0 || index === routeStops.length - 1
                      ? "bg-[#424874] text-white"
                      : "bg-[#F4EEFF] text-[#424874]"
                  }`}
                >
                  {stop}
                </span>
                {index < routeStops.length - 1 && (
                  <Icon
                    name="arrow"
                    className="mx-1 size-4 text-[#A6B1E1]"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="program"
        aria-labelledby="برنامه-روز‌به‌روز"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <SectionHeading
          eyebrow="نقشه راه"
          title="برنامه روز‌به‌روز"
          description="هر روز را یک‌جا ببینید؛ زمان حرکت، توقف‌ها، مسیر رانندگی و محل اقامت شب."
          icon="calendar"
        />

        <div className="space-y-5">
          {plan.days.map((day) => (
            <article
              key={day.id}
              className="overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_60px_rgba(66,72,116,0.07)] ring-1 ring-black/[0.035]"
            >
              <div className="grid lg:grid-cols-[0.72fr_1.5fr]">
                <div className="relative overflow-hidden bg-[#F7F7F9] p-6 sm:p-8 lg:p-10">
                  <div className="absolute -left-10 -top-12 size-48 rounded-full bg-white/30 blur-3xl" />
                  <div className="relative">
                    <span className="inline-flex rounded-full bg-[#424874] px-3 py-1.5 text-xs font-semibold text-white">
                      {day.weekday}
                    </span>
                    <div className="mt-8 flex items-start gap-4">
                      <span className="text-6xl font-light leading-none tracking-[-0.08em] text-[#424874]/25 sm:text-7xl">
                        {faNumber.format(day.dayNumber)}
                      </span>
                      <div>
                        <h3 className="text-2xl font-bold leading-tight tracking-[-0.035em] text-[#424874] sm:text-3xl">
                          {day.title}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-[#6B7190]">
                          {day.summary}
                        </p>
                      </div>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
                        <Icon name="car" className="mb-3 size-5 text-[#424874]" />
                        <strong className="block text-sm text-[#424874]">
                          {faNumber.format(day.drivingDistance)} کیلومتر
                        </strong>
                        <span className="mt-1 block text-xs text-[#6B7190]">
                          {day.drivingDuration}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
                        <Icon name="moon" className="mb-3 size-5 text-[#424874]" />
                        <strong className="block text-sm text-[#424874]">
                          {day.overnightCity}
                        </strong>
                        <span className="mt-1 block text-xs text-[#6B7190]">
                          اقامت شب
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <ol className="p-6 sm:p-8 lg:p-10">
                  {day.activities.map((activity, index) => (
                    <li
                      key={activity.id}
                      className="group grid grid-cols-[4.5rem_1fr] gap-3 sm:grid-cols-[5.5rem_1fr] sm:gap-5"
                    >
                      <time
                        dateTime={activity.time.replace(":", ":")}
                        className="pt-0.5 text-left text-sm font-semibold tabular-nums text-[#424874]"
                        dir="ltr"
                      >
                        {activity.time}
                      </time>
                      <div
                        className={`relative border-r border-[#DCD6F7] pr-6 sm:pr-8 ${
                          index === day.activities.length - 1
                            ? "pb-0"
                            : "pb-7 sm:pb-8"
                        }`}
                      >
                        <span className="absolute -right-[5px] top-1 size-[9px] rounded-full bg-[#424874] ring-4 ring-white transition-transform group-hover:scale-125 motion-reduce:transition-none" />
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h4 className="font-bold tracking-[-0.01em] text-[#424874]">
                            {activity.title}
                          </h4>
                          <span className="rounded-full bg-[#F4EEFF] px-2.5 py-1 text-[10px] font-semibold text-[#6B7190]">
                            {activity.category}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[#6B7190]">
                          {activity.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#8589A8]">
                          <span className="inline-flex items-center gap-1">
                            <Icon name="pin" className="size-3.5" />
                            {activity.location}
                          </span>
                          {activity.duration !== "—" && (
                            <span className="inline-flex items-center gap-1">
                              <Icon name="clock" className="size-3.5" />
                              {activity.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="places" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionHeading
            eyebrow="توقف‌های ماندگار"
            title="دیدنی‌های مسیر"
            description="مختصات هر مکان آماده است؛ بدون کلید API، مستقیم در Google Maps بازش کنید."
            icon="mountain"
          />

          <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 scrollbar-none sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
            {plan.locations.map((location) => (
              <article
                key={location.id}
                className="group w-[84vw] max-w-[23rem] shrink-0 snap-start overflow-hidden rounded-[1.5rem] border border-black/[0.06] bg-white shadow-[0_10px_30px_rgba(35,39,78,0.05)] sm:w-[22rem]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F5F8]">
                  <SafeImage
                    src={location.imageUrl}
                    alt={location.imageTitle || location.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
                  <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold text-[#424874] shadow-sm backdrop-blur-md">
                    {location.category}
                  </span>
                </div>
                <div className="p-5 sm:p-6">
                  <p className="text-[11px] font-semibold text-[#6B7190]">
                    {location.province}
                  </p>
                  <h3 className="mt-1 text-xl font-bold tracking-[-0.025em] text-[#424874]">
                    {location.name}
                  </h3>
                  <p className="mt-3 min-h-20 text-sm leading-7 text-[#6B7190]">
                    {location.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#DCD6F7] pt-4">
                    <span
                      dir="ltr"
                      className="text-[11px] tabular-nums text-[#8589A8]"
                    >
                      {location.latitude.toFixed(4)},{" "}
                      {location.longitude.toFixed(4)}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.07] bg-white px-3 py-2 text-xs font-semibold text-[#424874] outline-none transition-transform hover:bg-[#F5F5F8] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#424874]"
                      aria-label={`باز کردن ${location.name} در گوگل مپس`}
                    >
                      <Icon name="map" className="size-4" />
                      باز کردن نقشه
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="food"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <SectionHeading
          eyebrow="مزه‌های محلی"
          title="در مسیر چه بخوریم؟"
          description="چند انتخاب شاخص و عملی، مرتب‌شده بر اساس مسیر سفر."
          icon="food"
        />
        <div className="grid gap-px overflow-hidden rounded-[2rem] bg-[#DCD6F7] ring-1 ring-[#DCD6F7] sm:grid-cols-2 lg:grid-cols-3">
          {plan.foods.map((food, index) => (
            <article
              key={food.id}
              className="relative bg-white p-6 sm:p-7"
            >
              <span className="absolute left-5 top-5 text-3xl font-light text-[#DCD6F7]">
                {faNumber.format(index + 1)}
              </span>
              <span className="inline-flex rounded-full bg-[#F4EEFF] px-3 py-1 text-[10px] font-bold text-[#424874]">
                {food.city}
              </span>
              <h3 className="mt-5 text-lg font-bold text-[#424874]">
                {food.name}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#6B7190]">
                {food.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <CollaborationHub plan={plan} activeMember={activeMember} />

      <section id="safety" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionHeading
            eyebrow="قبل از حرکت"
            title="ایمنی جاده"
            description="این بخش را شب قبل از مسیر خلخال–اسالم دوباره مرور کنید."
            icon="shield"
          />
          <div className="grid gap-5 lg:grid-cols-[1.55fr_.65fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              {plan.safety.map((tip, index) => (
                <article
                  key={tip.id}
                  className={`rounded-[1.75rem] p-6 ${
                    index === 0
                      ? "bg-[#424874] text-white"
                      : "bg-white text-[#424874] ring-1 ring-black/[0.035]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`flex size-10 items-center justify-center rounded-xl ${
                        index === 0
                          ? "bg-white/10 text-white"
                          : "bg-[#DCD6F7] text-[#424874]"
                      }`}
                    >
                      <Icon
                        name={index < 2 ? "mountain" : index === 2 ? "clock" : "car"}
                        className="size-5"
                      />
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        index === 0
                          ? "bg-white/10 text-white/80"
                          : "bg-[#F4EEFF] text-[#6B7190]"
                      }`}
                    >
                      {tip.level}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-bold">{tip.title}</h3>
                  <p
                    className={`mt-2 text-sm leading-7 ${
                      index === 0 ? "text-white/70" : "text-[#6B7190]"
                    }`}
                  >
                    {tip.description}
                  </p>
                </article>
              ))}
            </div>

            <aside className="flex flex-col rounded-[1.75rem] bg-[#424874] p-6 text-white sm:p-7">
              <Icon name="shield" className="size-7 text-[#A6B1E1]" />
              <h3 className="mt-6 text-xl font-bold">شماره‌های ضروری</h3>
              <p className="mt-2 text-sm leading-7 text-white/55">
                شماره‌ها را پیش از ورود به مسیر کوهستانی در تلفن همراه ذخیره
                کنید.
              </p>
              <div className="mt-7 divide-y divide-white/10">
                {plan.emergency.map((contact) => (
                  <a
                    key={contact.id}
                    href={`tel:${contact.number
                      .replaceAll("۱", "1")
                      .replaceAll("۲", "2")
                      .replaceAll("۳", "3")
                      .replaceAll("۴", "4")
                      .replaceAll("۵", "5")
                      .replaceAll("۶", "6")
                      .replaceAll("۷", "7")
                      .replaceAll("۸", "8")
                      .replaceAll("۹", "9")
                      .replaceAll("۰", "0")}`}
                    className="flex items-center justify-between py-4 outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-[#A6B1E1]"
                  >
                    <span className="text-sm text-white/70">{contact.name}</span>
                    <strong dir="ltr" className="text-xl tabular-nums">
                      {contact.number}
                    </strong>
                  </a>
                ))}
              </div>
              <p className="mt-auto border-t border-white/10 pt-6 text-xs leading-6 text-white/45">
                در موقعیت اضطراری، اول مکان دقیق یا نزدیک‌ترین نشانه جاده‌ای را
                اعلام کنید.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <footer className="bg-[#424874] px-5 py-10 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-right">
          <div>
            <div className="flex items-center justify-center gap-2 font-bold sm:justify-start">
              <Icon name="compass" className="size-5 text-[#A6B1E1]" />
              {plan.title}
            </div>
            <p className="mt-2 text-xs text-white/45">
              برنامه‌ریزی شده برای یک سفر آرام، ایمن و به‌یادماندنی.
            </p>
          </div>
          <a
            href="#top"
            className="rounded-xl bg-white/8 px-4 py-2.5 text-xs font-semibold text-white/70 outline-none transition-colors hover:bg-white/12 hover:text-white focus-visible:ring-2 focus-visible:ring-[#A6B1E1]"
          >
            بازگشت به بالا
          </a>
        </div>
      </footer>
    </main>
  );
}

async function loadPlanSafely(slug: string) {
  try {
    return await getTripPlanBySlug(slug);
  } catch (error) {
    console.error("Could not load the travel plan.", error);
    return null;
  }
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/trip/${slug}`)}`);
  }

  const plan = await loadPlanSafely(slug);
  if (!plan) notFound();
  const activeMember = await getTripMemberForUser(slug, user.id);

  if (!activeMember) notFound();
  return <TravelPage plan={plan} activeMember={activeMember} />;
}
