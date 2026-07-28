"use client";

import { useEffect, useOptimistic, useRef } from "react";

import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import type { ChatMessage, TripMember } from "@/lib/types";
import { createMessageAction } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("fa-IR", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type DisplayMessage = ChatMessage & {
  clientId?: string;
  pending?: boolean;
};

type PendingMessage = {
  body: string;
  clientId: string;
  createdAt: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ member }: { member: TripMember }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#DCD6F7] text-[10px] font-bold text-[#424874]"
    >
      {initials(member.displayName)}
    </span>
  );
}

function messageDate(value: string) {
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  return dateFormatter.format(new Date(normalized));
}

export function ChatThread({
  messages,
  activeMember,
  tripSlug,
  view,
}: {
  messages: ChatMessage[];
  activeMember: TripMember;
  tripSlug: string;
  view: "sidebar" | "page" | "overlay";
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic<
    DisplayMessage[],
    PendingMessage
  >(messages, (currentMessages, pendingMessage) => [
    ...currentMessages,
    {
      id: -1,
      body: pendingMessage.body,
      createdAt: pendingMessage.createdAt,
      author: activeMember,
      clientId: pendingMessage.clientId,
      pending: true,
    },
  ]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [optimisticMessages.length]);

  async function sendMessage(formData: FormData) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;

    addOptimisticMessage({
      body,
      clientId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
    formRef.current?.reset();
    await createMessageAction(formData);
  }

  return (
    <>
      <div
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain"
        aria-live="polite"
      >
        {optimisticMessages.length ? (
          optimisticMessages.map((message) => {
            const mine = message.author.id === activeMember.id;
            return (
              <article
                key={message.clientId ?? message.id}
                className={`flex items-end gap-2 ${
                  mine ? "justify-start" : "justify-end"
                }`}
              >
                {mine && <Avatar member={message.author} />}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                    mine
                      ? "rounded-br-md bg-[#424874] text-white"
                      : "rounded-bl-md bg-[#F4EEFF] text-[#424874]"
                  } ${message.pending ? "opacity-75" : ""}`}
                >
                  <div className="flex items-center justify-between gap-5">
                    <strong className="text-[10px]">
                      {message.author.displayName}
                    </strong>
                    <time className="text-[9px] opacity-45" dir="ltr">
                      {messageDate(message.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 text-sm leading-7">{message.body}</p>
                  {message.pending && (
                    <span className="mt-1 flex items-center gap-1.5 text-[10px] text-white/65">
                      <span className="size-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
                      در حال ارسال…
                    </span>
                  )}
                </div>
                {!mine && <Avatar member={message.author} />}
              </article>
            );
          })
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <Icon name="chat" className="size-8 text-[#A6B1E1]" />
            <p className="mt-3 text-sm font-semibold text-[#6B7190]">
              هنوز پیامی نیست
            </p>
            <p className="mt-1 text-xs text-[#8589A8]">
              اولین هماهنگی سفر را شما بنویسید.
            </p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        ref={formRef}
        action={sendMessage}
        className="mt-6 flex items-end gap-2 border-t border-[#DCD6F7] pt-5"
      >
        <input type="hidden" name="tripSlug" value={tripSlug} />
        <input type="hidden" name="view" value={view} />
        <label className="min-w-0 flex-1">
          <span className="sr-only">
            پیام جدید از طرف {activeMember.displayName}
          </span>
          <textarea
            name="body"
            required
            maxLength={1000}
            rows={2}
            placeholder="پیام جدید…"
            className="min-h-12 w-full resize-none rounded-2xl border border-[#DCD6F7] bg-[#F4EEFF] px-4 py-3 text-sm leading-6 text-[#424874] outline-none transition-shadow placeholder:text-[#8589A8] focus:border-[#A6B1E1] focus:ring-4 focus:ring-[#DCD6F7]"
          />
        </label>
        <SubmitButton
          aria-label="ارسال پیام"
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#424874] text-white outline-none transition-transform active:scale-[0.95] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#424874]"
          pendingLabel="…"
        >
          <Icon name="send" className="size-5" />
        </SubmitButton>
      </form>
    </>
  );
}
