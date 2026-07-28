# برنامه سفر «از کویر تا مه»

یک راهنمای تک‌صفحه‌ای، فارسی و واکنش‌گرا برای سفر پنج‌روزه کاشان تا شمال‌غرب
ایران. برنامه روزها، جاذبه‌ها، پیشنهادهای غذایی، چک‌لیست وسایل و نکات ایمنی از
یک پایگاه داده محلی SQLite خوانده می‌شوند.

## پیش‌نیاز

- Node.js 22.5 یا جدیدتر (پروژه از ماژول داخلی `node:sqlite` استفاده می‌کند)
- npm

## نصب و اجرا

```bash
npm install
npm run seed
npm run dev
```

سپس `http://localhost:3000` را باز کنید.

## پایگاه داده

داده منبع در [`data/trip.json`](data/trip.json) قرار دارد. دستور `npm run seed`:

1. فایل `data/trip.db` را در صورت نیاز ایجاد می‌کند؛
2. جدول‌ها و ارتباط‌ها را می‌سازد؛
3. داده قبلی را در یک تراکنش پاک می‌کند؛
4. سفر، روزها، فعالیت‌ها، مکان‌ها، تصاویر، غذاها، وسایل و نکات ایمنی را وارد
   می‌کند.

فایل پایگاه داده تولیدی در Git نادیده گرفته می‌شود. بعد از هر تغییر در JSON،
دستور seed را دوباره اجرا کنید.

## دستورها

```bash
npm run dev     # محیط توسعه
npm run seed    # ساخت یا بازنشانی SQLite
npm run lint    # بررسی ESLint
npm run build   # ساخت production
npm start       # اجرای خروجی production
```

## معماری

- Next.js 16 App Router و React Server Components
- Tailwind CSS 4
- SQLite داخلی Node.js؛ بدون سرویس یا حساب خارجی
- یک Client Component کوچک برای چک‌لیست و یک wrapper برای fallback تصاویر
- لینک مستقیم Google Maps؛ بدون API key

برای ساخت production باید `npm run seed` پیش از `npm run build` اجرا شده باشد.
