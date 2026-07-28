"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { Icon } from "@/components/icons";

const panels = ["chat"] as const;

export function TripChrome({ chatPanel }: { chatPanel: ReactNode }) {
  const [panel, setPanel] = useQueryState(
    "panel",
    parseAsStringLiteral(panels).withOptions({
      history: "push",
      scroll: false,
    }),
  );
  const chatIsOpen = panel === "chat";
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!chatIsOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") void setPanel(null);
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [chatIsOpen, setPanel]);

  return (
    <>
      <button
        type="button"
        onClick={() => setPanel(chatIsOpen ? null : "chat")}
        aria-label={chatIsOpen ? "بستن گفتگوی سفر" : "باز کردن گفتگوی سفر"}
        aria-expanded={chatIsOpen}
        aria-controls="trip-chat-overlay"
        className="fixed bottom-24 left-4 z-50 flex size-13 items-center justify-center rounded-full bg-[#424874] text-white shadow-[0_12px_30px_rgba(35,39,78,.22)] outline-none transition-transform active:scale-[0.93] focus-visible:ring-2 focus-visible:ring-[#424874] focus-visible:ring-offset-2 lg:bottom-6 lg:left-6 lg:size-14"
      >
        <Icon name={chatIsOpen ? "close" : "chat"} className="size-6" />
      </button>

      <nav
        aria-label="ناوبری اصلی موبایل"
        className="fixed inset-x-3 bottom-3 z-40 grid h-16 grid-cols-4 rounded-2xl border border-black/[0.06] bg-white/95 px-2 shadow-[0_12px_35px_rgba(30,33,65,.12)] backdrop-blur-xl lg:hidden"
      >
        {[
          { href: "#program", icon: "calendar" as const, label: "برنامه" },
          { href: "#places", icon: "map" as const, label: "دیدنی‌ها" },
          { href: "#packing", icon: "bag" as const, label: "وسایل" },
          { href: "#expenses", icon: "wallet" as const, label: "هزینه‌ها" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium text-[#6B7190] outline-none transition-colors active:bg-[#F5F5F8] focus-visible:ring-2 focus-visible:ring-[#424874]"
          >
            <Icon name={item.icon} className="size-5" />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {chatIsOpen && (
        <div
          id="trip-chat-overlay"
          className="fixed inset-0 z-[70]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-overlay-title"
        >
          <button
            type="button"
            aria-label="بستن گفتگو"
            onClick={() => setPanel(null)}
            className="chat-overlay-scrim absolute inset-0 cursor-default bg-[#181a2e]/30 backdrop-blur-[2px]"
          />
          <section
            ref={dialogRef}
            className="chat-overlay-panel absolute inset-0 flex min-h-0 flex-col bg-white p-4 sm:bottom-4 sm:left-4 sm:right-auto sm:top-4 sm:w-[min(28rem,calc(100vw-2rem))] sm:rounded-[2rem] sm:p-3 sm:shadow-[0_30px_90px_rgba(20,23,48,.22)]"
          >
            <header className="flex h-12 shrink-0 items-center justify-between px-2">
              <div>
                <p className="text-[10px] font-semibold text-[#8589A8]">
                  گفتگوی سفر
                </p>
                <h2
                  id="chat-overlay-title"
                  className="text-sm font-bold text-[#30344f]"
                >
                  هماهنگی بین راه
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setPanel(null)}
                aria-label="بستن گفتگو"
                className="flex size-10 items-center justify-center rounded-full text-[#6B7190] outline-none transition-colors hover:bg-[#F5F5F8] focus-visible:ring-2 focus-visible:ring-[#424874]"
              >
                <Icon name="close" className="size-5" />
              </button>
            </header>
            <div className="chat-overlay-content min-h-0 flex-1">
              {chatPanel}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
