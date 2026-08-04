import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import type { TripMember, TripPlan } from "@/lib/types";
import {
  createExpenseAction,
  createPackingAction,
  deletePackingAction,
  togglePackingAction,
  updatePackingAction,
} from "./actions";
import { ChatThread } from "./chat-thread";
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

function Avatar({
  member,
  size = "normal",
}: {
  member: TripMember;
  size?: "small" | "normal";
}) {
  const colors = [
    "bg-[#DCD6F7] text-[#424874]",
    "bg-[#DCD6F7] text-[#424874]",
    "bg-[#DCD6F7] text-[#424874]",
  ];

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${
        size === "small" ? "size-8 text-[10px]" : "size-11 text-xs"
      } ${colors[(member.id - 1) % colors.length]}`}
    >
      {initials(member.displayName)}
    </span>
  );
}

function HiddenContext({
  plan,
}: {
  plan: TripPlan;
}) {
  return (
    <>
      <input type="hidden" name="tripSlug" value={plan.slug} />
    </>
  );
}

function TeamSwitcher({
  plan,
  activeMember,
}: {
  plan: TripPlan;
  activeMember: TripMember;
}) {
  return (
    <section
      id="team"
      className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10"
      aria-labelledby="team-title"
    >
      <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_55px_rgba(66,72,116,0.07)] ring-1 ring-black/[0.035]">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[.8fr_1.6fr] lg:p-10">
          <div>
            <span className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-[#DCD6F7] text-[#424874]">
              <Icon name="users" className="size-5" />
            </span>
            <p className="text-xs font-semibold text-[#424874]">گروه سفر</p>
            <h2
              id="team-title"
              className="mt-1 text-2xl font-bold tracking-[-0.035em] text-[#424874]"
            >
              سه هم‌سفر، یک برنامه
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {plan.members.map((member) => {
              const isActive = member.id === activeMember.id;
              return (
                <article
                  key={member.id}
                  aria-current={isActive ? "true" : undefined}
                  className={`flex min-h-28 w-full items-center gap-3 rounded-3xl p-4 text-right ${
                      isActive
                        ? "bg-[#424874] text-white shadow-lg shadow-[#424874]/10"
                        : "bg-[#F4EEFF] text-[#424874]"
                    }`}
                >
                    <Avatar member={member} />
                    <span>
                      <strong className="block text-sm">
                        {member.displayName}
                      </strong>
                      <span
                        className={`mt-1 block text-[10px] ${
                          isActive ? "text-white/55" : "text-[#8589A8]"
                        }`}
                      >
                        {isActive
                          ? "شما"
                          : member.role === "organizer"
                            ? "برنامه‌ریز سفر"
                            : "هم‌سفر"}
                      </span>
                    </span>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function PackingBoard({
  plan,
  activeMember,
}: {
  plan: TripPlan;
  activeMember: TripMember;
}) {
  const personalCategories = plan.packing
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) => item.assignedMemberId === activeMember.id,
      ),
    }))
    .filter((category) => category.items.length);
  const personalItems = personalCategories.flatMap((category) => category.items);
  const completed = personalItems.filter((item) => item.isPacked).length;
  const progress = personalItems.length
    ? Math.round((completed / personalItems.length) * 100)
    : 0;
  const defaultCategoryId =
    plan.packing.find((category) => category.name === "دیگر")?.id ??
    plan.packing[0]?.id;

  return (
    <section
      id="packing"
      className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10"
      aria-labelledby="packing-title"
    >
      <div className="overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white text-[#30344f] shadow-[0_16px_50px_rgba(35,39,78,0.06)]">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[.72fr_1.7fr] lg:p-10">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#F5F5F8] text-[#424874]">
                <Icon name="bag" className="size-6" />
              </span>
              <p className="text-xs font-semibold text-[#6B7190]">
                مسئولیت‌های {activeMember.displayName}
              </p>
              <h2
                id="packing-title"
                className="mt-1 text-2xl font-bold tracking-[-0.03em] sm:text-3xl"
              >
                وسایلی که باید بیاوری
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-7 text-[#6B7190]">
                وضعیت و مسئول هر وسیله در پایگاه داده سفر ذخیره می‌شود و برای
                همه هم‌سفرها قابل مشاهده و ویرایش است.
              </p>
            </div>

            <div aria-live="polite">
              <div className="mb-3 flex items-end justify-between gap-4">
                <span className="text-4xl font-semibold tabular-nums">
                  {moneyFormatter.format(progress)}٪
                </span>
                <span className="pb-1 text-xs text-[#8589A8]">
                  {moneyFormatter.format(completed)} از{" "}
                  {moneyFormatter.format(personalItems.length)} آماده
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#ECECF2]">
                <div
                  className="h-full rounded-full bg-[#424874] transition-[width] duration-300 motion-reduce:transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            {personalCategories.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {personalCategories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-3xl border border-black/[0.06] bg-[#FAFAFC] p-4 sm:p-5"
                  >
                    <h3 className="mb-3 text-xs font-semibold text-[#6B7190]">
                      {category.name}
                    </h3>
                    <div className="space-y-2">
                      {category.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-black/[0.06] bg-white p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <form action={togglePackingAction}>
                              <HiddenContext plan={plan} />
                              <input
                                type="hidden"
                                name="itemId"
                                value={item.id}
                              />
                              <button
                                type="submit"
                                aria-label={
                                  item.isPacked
                                    ? `علامت‌زدایی ${item.label}`
                                    : `آماده‌کردن ${item.label}`
                                }
                                className={`flex size-8 items-center justify-center rounded-xl outline-none transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-[#A6B1E1] ${
                                  item.isPacked
                                    ? "bg-[#424874] text-white"
                                    : "bg-white text-[#A6A9B8] ring-1 ring-inset ring-black/10"
                                }`}
                              >
                                <Icon name="check" className="size-4" />
                              </button>
                            </form>
                            <span
                              className={`min-w-0 flex-1 text-sm ${
                                item.isPacked
                                  ? "text-[#A6A9B8] line-through"
                                  : "text-[#30344f]"
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                            <details className="mt-2 w-full">
                              <summary className="w-fit cursor-pointer list-none rounded-lg px-2 py-1 text-[10px] text-[#6B7190] hover:bg-[#F1F1F5] hover:text-[#30344f]">
                                ویرایش
                              </summary>
                              <div className="mt-2 border-t border-black/[0.07] pt-3">
                                <form
                                  action={updatePackingAction}
                                  className="space-y-2"
                                >
                                  <HiddenContext plan={plan} />
                                  <input
                                    type="hidden"
                                    name="itemId"
                                    value={item.id}
                                  />
                                  <input
                                    className="h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs text-[#30344f] outline-none focus:border-[#A6B1E1] focus:ring-3 focus:ring-[#DCD6F7]/60"
                                    name="label"
                                    defaultValue={item.label}
                                    maxLength={120}
                                    required
                                  />
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <select
                                      className="h-10 min-w-0 rounded-xl border border-black/[0.08] bg-white px-2 text-[11px] text-[#30344f] outline-none"
                                      name="categoryId"
                                      defaultValue={category.id}
                                    >
                                      {plan.packing.map((option) => (
                                        <option
                                          key={option.id}
                                          value={option.id}
                                        >
                                          {option.name}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      className="h-10 min-w-0 rounded-xl border border-black/[0.08] bg-white px-2 text-[11px] text-[#30344f] outline-none"
                                      name="assignedMemberId"
                                      defaultValue={
                                        item.assignedMemberId ?? undefined
                                      }
                                    >
                                      {plan.members.map((member) => (
                                        <option
                                          key={member.id}
                                          value={member.id}
                                        >
                                          {member.displayName}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <SubmitButton className="flex h-9 w-full items-center justify-center rounded-xl bg-[#424874] text-xs font-bold text-white disabled:opacity-60">
                                    ذخیره تغییر
                                  </SubmitButton>
                                </form>
                                <form
                                  action={deletePackingAction}
                                  className="mt-2"
                                >
                                  <HiddenContext plan={plan} />
                                  <input
                                    type="hidden"
                                    name="itemId"
                                    value={item.id}
                                  />
                                  <SubmitButton className="h-8 w-full rounded-xl text-[10px] text-[#a2513c] hover:bg-[#fff4f1]">
                                    حذف وسیله
                                  </SubmitButton>
                                </form>
                              </div>
                            </details>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-black/[0.06] bg-[#FAFAFC] p-8 text-center text-sm text-[#6B7190]">
                هنوز وسیله‌ای به {activeMember.displayName} سپرده نشده است.
              </div>
            )}

            <form
              action={createPackingAction}
              className="mt-4 grid gap-2 rounded-3xl border border-black/[0.06] bg-[#FAFAFC] p-4 sm:grid-cols-2 lg:grid-cols-[1fr_.7fr_.7fr_auto]"
            >
              <HiddenContext plan={plan} />
              <input
                name="label"
                required
                maxLength={120}
                placeholder="وسیله جدید…"
                className="h-11 min-w-0 rounded-xl border border-black/[0.08] bg-white px-3 text-sm text-[#30344f] outline-none placeholder:text-[#A6A9B8] focus:border-[#A6B1E1] focus:ring-3 focus:ring-[#DCD6F7]/60"
              />
              <select
                name="categoryId"
                aria-label="دسته‌بندی"
                className="h-11 min-w-0 rounded-xl border border-black/[0.08] bg-white px-3 text-xs text-[#30344f] outline-none"
                defaultValue={defaultCategoryId}
              >
                {plan.packing.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                name="assignedMemberId"
                aria-label="مسئول وسیله"
                className="h-11 min-w-0 rounded-xl border border-black/[0.08] bg-white px-3 text-xs text-[#30344f] outline-none"
                defaultValue={activeMember.id}
              >
                {plan.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName}
                  </option>
                ))}
              </select>
              <SubmitButton className="flex h-11 items-center justify-center rounded-xl bg-[#424874] px-4 text-xs font-bold text-white disabled:opacity-60 sm:col-span-2 lg:col-span-1">
                افزودن
              </SubmitButton>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExpenseBoard({
  plan,
  activeMember,
}: {
  plan: TripPlan;
  activeMember: TripMember;
}) {
  const total = plan.expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <section id="expenses" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-white text-[#424874]">
              <Icon name="wallet" className="size-5" />
            </span>
            <p className="text-xs font-semibold text-[#424874]">حساب مشترک</p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.035em] text-[#424874] sm:text-3xl">
              هزینه‌ها و تسویه
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6B7190]">
              هزینه را ثبت کنید، افراد شریک را مشخص کنید و مانده هر نفر را
              همان لحظه ببینید.
            </p>
          </div>
          <div className="w-full rounded-3xl border border-black/[0.06] bg-white px-7 py-5 text-left shadow-sm sm:w-auto sm:min-w-64">
            <span className="block text-sm font-medium text-[#6B7190]">
              جمع هزینه‌ها
            </span>
            <strong
              className="mt-2 block text-3xl font-bold text-[#424874] sm:text-4xl"
              dir="ltr"
            >
              {moneyFormatter.format(total)}{" "}
              <small className="text-sm font-normal">تومان</small>
            </strong>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <div className="order-2 space-y-5 lg:order-1">
            <div className="grid gap-3 sm:grid-cols-3">
              {plan.balances.map((balance) => (
                <article
                  key={balance.member.id}
                  className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-[0_10px_30px_rgba(35,39,78,0.04)]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar member={balance.member} size="small" />
                    <strong className="text-sm text-[#424874]">
                      {balance.member.displayName}
                    </strong>
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <span
                      className={`text-lg font-bold ${
                        balance.balance > 0
                          ? "text-[#424874]"
                          : balance.balance < 0
                            ? "text-[#a2513c]"
                            : "text-[#6B7190]"
                      }`}
                      dir="ltr"
                    >
                      {balance.balance > 0 ? "+" : ""}
                      {moneyFormatter.format(balance.balance)}
                    </span>
                    <span className="pb-1 text-[10px] text-[#8589A8]">
                      {balance.balance > 0
                        ? "طلبکار"
                        : balance.balance < 0
                          ? "بدهکار"
                          : "تسویه"}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-[#DCD6F7] pt-3 text-[10px] text-[#8589A8]">
                    <span>پرداخت {moneyFormatter.format(balance.paid)}</span>
                    <span>سهم {moneyFormatter.format(balance.owed)}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-black/[0.06] bg-white p-5 sm:p-6">
              <h3 className="font-bold text-[#424874]">پیشنهاد تسویه</h3>
              {plan.settlements.length ? (
                <div className="mt-4 space-y-2">
                  {plan.settlements.map((settlement, index) => (
                    <div
                      key={`${settlement.from.id}-${settlement.to.id}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F7F7F9] px-4 py-3 text-sm"
                    >
                      <span className="text-[#6B7190]">
                        <strong className="text-[#9b4e3a]">
                          {settlement.from.displayName}
                        </strong>{" "}
                        به{" "}
                        <strong className="text-[#424874]">
                          {settlement.to.displayName}
                        </strong>{" "}
                        پرداخت کند
                      </span>
                      <strong className="text-[#424874]" dir="ltr">
                        {moneyFormatter.format(settlement.amount)} تومان
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-7 text-[#6B7190]">
                  فعلاً بدهی بازی وجود ندارد. با ثبت اولین هزینه، پیشنهاد تسویه
                  اینجا نمایش داده می‌شود.
                </p>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-black/[0.06] bg-white p-5 sm:p-6">
              <h3 className="font-bold text-[#424874]">ریز هزینه‌ها</h3>
              {plan.expenses.length ? (
                <div className="mt-4 divide-y divide-[#DCD6F7]">
                  {plan.expenses.map((expense) => (
                    <article
                      key={expense.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar member={expense.payer} size="small" />
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
                                {expense.participants
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
                            tripSlug={plan.slug}
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
                <p className="mt-3 text-sm text-[#6B7190]">
                  هنوز هزینه‌ای برای این سفر ثبت نشده است.
                </p>
              )}
            </div>
          </div>

          <form
            action={createExpenseAction}
            className="order-1 h-fit rounded-[1.75rem] border border-black/[0.07] bg-[#FAFAFC] p-6 text-[#30344f] shadow-[0_14px_40px_rgba(35,39,78,0.05)] sm:p-7 lg:order-2"
          >
            <HiddenContext plan={plan} />
            <p className="text-xs font-semibold text-[#6B7190]">
              ثبت‌کننده: {activeMember.displayName}
            </p>
            <h3 className="mt-1 text-xl font-bold">هزینه جدید</h3>
            <div className="mt-6 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs text-[#6B7190]">
                  چه کسی پرداخت کرده؟
                </span>
                <select
                  name="payerMemberId"
                  defaultValue={activeMember.id}
                  className="h-12 w-full rounded-2xl border border-black/[0.08] bg-white px-4 text-sm text-[#30344f] outline-none focus:border-[#A6B1E1] focus:ring-3 focus:ring-[#DCD6F7]/60"
                >
                  {plan.members.map((member) => (
                    <option
                      key={member.id}
                      value={member.id}
                      className="bg-white"
                    >
                      {member.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-[#6B7190]">
                  بابت چه چیزی؟
                </span>
                <input
                  className="h-12 w-full rounded-2xl border border-black/[0.08] bg-white px-4 text-sm text-[#30344f] outline-none placeholder:text-[#A6A9B8] focus:border-[#A6B1E1] focus:ring-3 focus:ring-[#DCD6F7]/60"
                  name="description"
                  maxLength={160}
                  placeholder="مثلاً بنزین مسیر تبریز"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-[#6B7190]">
                  مبلغ به تومان
                </span>
                <input
                  className="h-12 w-full rounded-2xl border border-black/[0.08] bg-white px-4 text-sm text-[#30344f] outline-none placeholder:text-[#A6A9B8] focus:border-[#A6B1E1] focus:ring-3 focus:ring-[#DCD6F7]/60"
                  name="amount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  placeholder="450000"
                  dir="ltr"
                  required
                />
              </label>
              <fieldset>
                <legend className="mb-2 text-xs text-[#6B7190]">
                  سهم چه کسانی است؟
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {plan.members.map((member) => (
                    <label
                      key={member.id}
                      className="flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-black/[0.07] bg-white px-2 py-3 text-[11px] text-[#4d526f]"
                    >
                      <input
                        type="checkbox"
                        name="participantMemberIds"
                        value={member.id}
                        defaultChecked
                        className="accent-[#A6B1E1]"
                      />
                      {member.displayName}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <SubmitButton
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#424874] px-4 text-sm font-bold text-white outline-none transition-transform active:scale-[0.98] disabled:opacity-60"
              pendingLabel="در حال محاسبه…"
            >
              <Icon name="wallet" className="size-4" />
              ثبت و تقسیم هزینه
            </SubmitButton>
          </form>
        </div>
      </div>
    </section>
  );
}

export function ChatPanel({
  plan,
  activeMember,
  view = "sidebar",
}: {
  plan: TripPlan;
  activeMember: TripMember;
  view?: "sidebar" | "page" | "overlay";
}) {
  const isPage = view === "page";
  const isOverlay = view === "overlay";
  return (
    <section
      id="chat"
      className={
        isPage
          ? "mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12"
          : "flex h-full min-h-0 flex-col"
      }
      aria-labelledby="chat-title"
    >
      <div
        className={`overflow-hidden bg-white ${
          isPage
            ? "grid rounded-[2rem] shadow-[0_20px_65px_rgba(66,72,116,0.08)] lg:grid-cols-[.7fr_1.4fr]"
            : isOverlay
              ? "flex h-full min-h-0 flex-col"
              : "flex h-full min-h-0 flex-col rounded-[1.75rem] shadow-[0_20px_65px_rgba(30,33,65,0.2)]"
        }`}
      >
        {isPage && (
          <div className="hidden bg-[#DCD6F7] p-6 sm:p-8 md:block lg:p-10">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#424874] text-white">
            <Icon name="chat" className="size-6" />
          </span>
          <p className="mt-7 text-xs font-semibold text-[#424874]">
            گفتگوی سفر
          </p>
          <h2
            id="chat-title"
            className="mt-1 text-2xl font-bold tracking-[-0.035em] text-[#424874]"
          >
            هماهنگی بین راه
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#6B7190]">
            تصمیم‌ها، زمان حرکت و یادآوری‌های گروه را همین‌جا نگه دارید تا همراه
            برنامه سفر باقی بماند.
          </p>
          <div className="mt-8 flex -space-x-2 space-x-reverse">
            {plan.members.map((member) => (
              <span
                key={member.id}
                className="rounded-full ring-2 ring-[#DCD6F7]"
                title={member.displayName}
              >
                <Avatar member={member} />
              </span>
            ))}
          </div>
          </div>
        )}

        <div
          className={`flex min-h-0 flex-col ${
            isPage
              ? "min-h-[calc(100dvh-8rem)] p-5 sm:p-7 md:min-h-[32rem] lg:p-9"
              : "h-full p-5"
          }`}
        >
          <div
            className={`mb-4 items-center justify-between border-b border-[#DCD6F7] pb-4 ${
              isOverlay ? "hidden" : isPage ? "flex md:hidden" : "flex"
            }`}
          >
              <div>
                <p className="text-[10px] font-semibold text-[#8589A8]">
                  گفتگوی سفر
                </p>
                <h2 id="chat-title" className="mt-0.5 font-bold text-[#424874]">
                  هماهنگی بین راه
                </h2>
              </div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#DCD6F7] text-[#424874]">
                <Icon name="chat" className="size-5" />
              </span>
          </div>
          <ChatThread
            messages={plan.messages}
            activeMember={activeMember}
            tripSlug={plan.slug}
            view={view}
          />
        </div>
      </div>
    </section>
  );
}

export function CollaborationHub({
  plan,
  activeMember,
}: {
  plan: TripPlan;
  activeMember: TripMember;
}) {
  return (
    <>
      <TeamSwitcher plan={plan} activeMember={activeMember} />
      <PackingBoard plan={plan} activeMember={activeMember} />
      <ExpenseBoard plan={plan} activeMember={activeMember} />
    </>
  );
}
