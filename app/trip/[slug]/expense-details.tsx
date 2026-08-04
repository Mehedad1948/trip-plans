"use client";

import { useState } from "react";

import type { Expense, TripMember } from "@/lib/types";
import { ExpenseDeleteDialog } from "./expense-delete-dialog";

const moneyFormatter = new Intl.NumberFormat("fa-IR");

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function PayerAvatar({ member }: { member: TripMember }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#DCD6F7] text-[10px] font-bold text-[#424874]"
    >
      {initials(member.displayName)}
    </span>
  );
}

export function ExpenseDetails({
  expenses,
  activeMember,
  tripSlug,
  memberCount,
}: {
  expenses: Expense[];
  activeMember: TripMember;
  tripSlug: string;
  memberCount: number;
}) {
  const [payerId, setPayerId] = useState<number | null>(null);
  const payers = Array.from(
    new Map(expenses.map((expense) => [expense.payer.id, expense.payer])).values(),
  );
  const filteredExpenses = payerId
    ? expenses.filter((expense) => expense.payer.id === payerId)
    : expenses;

  return (
    <div className="rounded-[1.75rem] border border-black/[0.06] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-bold text-[#424874]">ریز هزینه‌ها</h3>
        {payers.length > 1 && (
          <div
            className="flex max-w-full gap-1.5 overflow-x-auto pb-1"
            role="group"
            aria-label="فیلتر بر اساس پرداخت‌کننده"
          >
            <button
              type="button"
              onClick={() => setPayerId(null)}
              aria-pressed={payerId === null}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium outline-none transition-colors active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#424874] focus-visible:ring-offset-2 ${
                payerId === null
                  ? "bg-[#424874] text-white"
                  : "bg-[#F2F1F8] text-[#6B7190] hover:bg-[#E7E4F4]"
              }`}
            >
              همه
            </button>
            {payers.map((payer) => (
              <button
                key={payer.id}
                type="button"
                onClick={() => setPayerId(payer.id)}
                aria-pressed={payerId === payer.id}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium outline-none transition-colors active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#424874] focus-visible:ring-offset-2 ${
                  payerId === payer.id
                    ? "bg-[#424874] text-white"
                    : "bg-[#F2F1F8] text-[#6B7190] hover:bg-[#E7E4F4]"
                }`}
              >
                {payer.displayName}
              </button>
            ))}
          </div>
        )}
      </div>

      {expenses.length ? (
        filteredExpenses.length ? (
          <div className="mt-4 divide-y divide-[#DCD6F7]">
            {filteredExpenses.map((expense) => (
              <article
                key={expense.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <PayerAvatar member={expense.payer} />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#424874]">
                      {expense.description}
                    </h4>
                    <dl className="mt-2 space-y-1.5 text-[11px] leading-5">
                      <div className="flex items-start gap-2">
                        <dt className="w-16 shrink-0 text-[#8589A8]">
                          پرداخت توسط
                        </dt>
                        <dd className="font-medium text-[#5F6485]">
                          {expense.payer.displayName}
                        </dd>
                      </div>
                      <div className="flex items-start gap-2">
                        <dt className="w-16 shrink-0 text-[#8589A8]">
                          تقسیم بین
                        </dt>
                        <dd className="text-[#5F6485]">
                          {expense.participants.length === memberCount
                            ? "همه"
                            : expense.participants
                                .map((item) => item.displayName)
                                .join("، ")}
                        </dd>
                      </div>
                      {expense.recordedBy.slug !== "mehrdad" && (
                        <div className="flex items-start gap-2">
                          <dt className="w-16 shrink-0 text-[#8589A8]">
                            ثبت توسط
                          </dt>
                          <dd className="text-[#5F6485]">
                            {expense.recordedBy.displayName}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <strong className="text-sm text-[#424874]" dir="ltr">
                    {moneyFormatter.format(expense.amount)} تومان
                  </strong>
                  {expense.recordedBy.id === activeMember.id && (
                    <ExpenseDeleteDialog
                      tripSlug={tripSlug}
                      expenseId={expense.id}
                      description={expense.description}
                      amountLabel={`${moneyFormatter.format(expense.amount)} تومان`}
                    />
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#6B7190]">
            هزینه‌ای با این فیلتر پیدا نشد.
          </p>
        )
      ) : (
        <p className="mt-3 text-sm text-[#6B7190]">
          هنوز هزینه‌ای برای این سفر ثبت نشده است.
        </p>
      )}
    </div>
  );
}
