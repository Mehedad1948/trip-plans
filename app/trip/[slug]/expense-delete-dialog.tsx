"use client";

import { useId, useRef } from "react";

import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { deleteExpenseAction } from "./actions";

export function ExpenseDeleteDialog({
  tripSlug,
  expenseId,
  description,
  amountLabel,
}: {
  tripSlug: string;
  expenseId: number;
  description: string;
  amountLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  function openDialog() {
    dialogRef.current?.showModal();
    requestAnimationFrame(() => cancelRef.current?.focus());
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        aria-haspopup="dialog"
        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold text-[#9b4434] outline-none transition-colors hover:bg-[#faeee9] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#9b4434] focus-visible:ring-offset-2"
      >
        <Icon name="trash" className="size-3.5" />
        حذف
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
        className="expense-delete-dialog m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-[1.75rem] border border-black/[0.06] bg-white p-0 text-right text-[#424874] shadow-[0_28px_90px_rgba(28,31,61,0.22)] backdrop:bg-[#23274e]/35 backdrop:backdrop-blur-[3px]"
      >
        <form action={deleteExpenseAction} className="p-6 sm:p-7">
          <input type="hidden" name="tripSlug" value={tripSlug} />
          <input type="hidden" name="expenseId" value={expenseId} />

          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#faeee9] text-[#9b4434]">
            <Icon name="trash" className="size-5" />
          </span>
          <h2
            id={titleId}
            className="mt-5 text-xl font-bold tracking-[-0.025em]"
          >
            این هزینه حذف شود؟
          </h2>
          <p
            id={descriptionId}
            className="mt-2 text-sm leading-7 text-[#6B7190]"
          >
            این کار هزینه و سهم تمام هم‌سفرها را حذف می‌کند و قابل بازگشت نیست.
          </p>

          <div className="mt-5 rounded-2xl border border-black/[0.06] bg-[#FAFAFC] p-4">
            <p className="text-sm font-bold">{description}</p>
            <p className="mt-1 text-xs text-[#6B7190]" dir="ltr">
              {amountLabel}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              ref={cancelRef}
              type="button"
              onClick={closeDialog}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-sm font-semibold outline-none transition-colors hover:bg-[#F7F7F9] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#424874]"
            >
              انصراف
            </button>
            <SubmitButton
              pendingLabel="در حال حذف…"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#9b4434] px-4 text-sm font-semibold text-white outline-none transition-transform active:scale-[0.98] disabled:opacity-65 focus-visible:ring-2 focus-visible:ring-[#9b4434] focus-visible:ring-offset-2"
            >
              <Icon name="trash" className="size-4" />
              حذف هزینه
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
