"use client";

import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/icons";
import type { PackingCategory } from "@/lib/types";

const STORAGE_KEY = "iran-road-trip-packing-v1";

export function PackingChecklist({
  categories,
}: {
  categories: PackingCategory[];
}) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [ready, setReady] = useState(false);
  const total = useMemo(
    () => categories.reduce((sum, category) => sum + category.items.length, 0),
    [categories],
  );

  useEffect(() => {
    let active = true;
    const restore = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (active && stored) {
          setChecked(new Set(JSON.parse(stored) as number[]));
        }
      } catch {
        // A private browsing policy can make localStorage unavailable.
      } finally {
        if (active) {
          setReady(true);
        }
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(restore);
    };
  }, []);

  function toggle(itemId: number) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // The checklist remains usable for the current session.
      }

      return next;
    });
  }

  const completed = ready ? checked.size : 0;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-[2rem] bg-[#173d32] text-white shadow-[0_24px_70px_rgba(18,61,49,0.18)]">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.75fr_1.75fr] lg:p-10">
        <div className="flex flex-col justify-between gap-8">
          <div>
            <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-white/10 text-[#b8dfca]">
              <Icon name="bag" className="size-6" />
            </span>
            <h3 className="text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
              وسایل سفر
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-7 text-white/65">
              انتخاب‌های شما روی همین دستگاه ذخیره می‌شود و برای سفر بعدی باقی
              می‌ماند.
            </p>
          </div>

          <div aria-live="polite">
            <div className="mb-3 flex items-end justify-between gap-4">
              <span className="text-4xl font-semibold tabular-nums">
                {progress.toLocaleString("fa-IR")}٪
              </span>
              <span className="pb-1 text-xs text-white/55">
                {completed.toLocaleString("fa-IR")} از{" "}
                {total.toLocaleString("fa-IR")} آماده
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#b8dfca] transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-3xl bg-white/[0.07] p-5 ring-1 ring-inset ring-white/10"
            >
              <h4 className="mb-4 text-sm font-semibold text-[#b8dfca]">
                {category.name}
              </h4>
              <div className="space-y-1">
                {category.items.map((item) => {
                  const isChecked = checked.has(item.id);
                  return (
                    <label
                      key={item.id}
                      className="group flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2.5 text-sm leading-6 transition-colors hover:bg-white/5 active:bg-white/10"
                    >
                      <input
                        type="checkbox"
                        checked={ready && isChecked}
                        onChange={() => toggle(item.id)}
                        className="sr-only"
                      />
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md ring-1 transition-colors ${
                          isChecked
                            ? "bg-[#b8dfca] text-[#173d32] ring-[#b8dfca]"
                            : "text-transparent ring-white/25 group-hover:ring-white/50"
                        }`}
                      >
                        <Icon name="check" className="size-3.5" />
                      </span>
                      <span
                        className={
                          isChecked
                            ? "text-white/40 line-through"
                            : "text-white/80"
                        }
                      >
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
