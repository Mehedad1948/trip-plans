# برنامه سفر «از کویر تا مه»

یک برنامه فارسی، راست‌به‌چپ و واکنش‌گرا برای مدیریت سفر گروهی. برنامه روزها،
دیدنی‌ها، وسایل هر هم‌سفر، گفت‌وگوی گروهی، هزینه‌ها و تسویه‌حساب از SQLite
خوانده می‌شوند. نسخه وب به‌صورت PWA نصب می‌شود و برای پیام‌ها و هزینه‌های تازه
Web Push بومی می‌فرستد.

## پیش‌نیاز

- Node.js 22.5 یا جدیدتر؛ پروژه از `node:sqlite` استفاده می‌کند.
- npm

## نصب و اجرا

```bash
npm install
npm run seed
npm run dev
```

سپس `http://localhost:3000` را باز کنید. مسیر سفر فعلی:

```text
/trip/az-kavir-ta-meh
```

## حساب‌های اولیه

| نام کاربری | نام نمایشی | رمز موقت |
| --- | --- | --- |
| `mehrdad` | Mehrdad | `123456` |
| `amir-mohammad` | Amir Mohammad | `123456` |
| `ali` | Ali | `123456` |

رمزها با `scrypt` هش می‌شوند. نشست ورود با یک token تصادفی، رکورد قابل ابطال
در SQLite و cookie امن `HttpOnly` مدیریت می‌شود. رمزهای اولیه را پیش از
استفاده عمومی تغییر دهید.

## پایگاه داده و seed

داده منبع در [`data/trip.json`](data/trip.json) است. `npm run seed` فایل
`data/trip.db` را می‌سازد، جداول را از نو ایجاد می‌کند و کاربران، عضویت سفر،
روزها، مکان‌ها، وسایل، پیام‌ها، هزینه‌ها و اشتراک‌های Push را وارد می‌کند.
اجرای دوباره seed داده‌های قابل ویرایش فعلی را پاک می‌کند.

فایل SQLite در Git نادیده گرفته شده است. جدول `push_subscriptions` در اجرای
برنامه نیز با `CREATE TABLE IF NOT EXISTS` ایجاد می‌شود تا ارتقای دیتابیس موجود
بدون پاک شدن اطلاعات ممکن باشد.

## PWA و اعلان‌های بومی

یک بار کلیدهای VAPID را بسازید:

```bash
npm run push:keys
```

خروجی را در `.env.local` برای محیط محلی و در Environment Variables میزبان برای
محیط production قرار دهید:

```dotenv
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:your-real-email@example.com
```

بعد از تغییر `NEXT_PUBLIC_VAPID_PUBLIC_KEY` سرور را دوباره اجرا کنید. دکمه زنگ
در نوار بالای سفر، اعلان پیام‌ها و هزینه‌ها را برای حساب فعال روشن یا خاموش
می‌کند. هر endpoint فقط به آخرین حسابی که روی همان مرورگر وارد شده متصل می‌شود.

Web Push به HTTPS نیاز دارد. `localhost` در مرورگرهای مدرن secure context محسوب
می‌شود؛ برای آزمایش روی تلفن یا شبکه محلی از HTTPS استفاده کنید. در iPhone و
iPad (iOS/iPadOS 16.4 به بعد)، سایت باید ابتدا با «Add to Home Screen» نصب و
از آیکن نصب‌شده باز شود تا درخواست اعلان کار کند.

Service worker عمداً صفحات احراز‌شده، پاسخ‌های RSC و API را cache نمی‌کند تا
اطلاعات یک حساب روی دستگاه مشترک به حساب بعدی نمایش داده نشود. فقط پوسته آفلاین،
manifest، آیکن‌ها و فایل‌های static کش می‌شوند.

## استقرار و SQLite

SQLite محلی روی یک سرور Node دائمی یا VPS کار می‌کند، اما filesystem توابع
Serverless در Vercel پایدار نیست. برای استقرار واقعی روی Vercel، داده‌های
برنامه و جدول `push_subscriptions` باید به یک دیتابیس پایدار مانند Turso/LibSQL
یا یک سرویس SQLite سازگار منتقل شوند. بدون این مهاجرت، عضویت اعلان‌ها، پیام‌ها
و هزینه‌های تازه ممکن است بین اجراهای Vercel از بین بروند.

همچنین سه متغیر VAPID بالا باید در هر دو محیط Preview و Production تنظیم شوند.
کلید private را فقط سمت سرور نگه دارید و هرگز با پیشوند `NEXT_PUBLIC_` منتشر
نکنید.

## دستورها

```bash
npm run dev        # محیط توسعه
npm run seed       # ساخت یا بازنشانی SQLite
npm run push:keys  # تولید یک جفت کلید VAPID
npm run lint       # ESLint
npm run build      # build production
npm start          # اجرای build
```

## معماری

- Next.js 16 App Router و React Server Components
- Tailwind CSS 4 و فونت فارسی Vazirmatn
- SQLite داخلی Node.js، بدون سرویس خارجی در محیط محلی
- مسیر مستقل هر سفر با `/trip/[slug]`
- کاربران مستقل و عضویت چندبه‌چند با `users` و `trip_members`
- احراز هویت username/password و نشست‌های قابل ابطال
- وسایل قابل ویرایش و وضعیت آماده‌سازی برای هر عضو
- گفت‌وگوی overlay با `nuqs` و `?panel=chat`
- هزینه، پرداخت‌کننده، ثبت‌کننده، شرکا، سهم دقیق و پیشنهاد تسویه
- Web App Manifest، service worker، fallback آفلاین و Web Push مبتنی بر VAPID

تمام mutationها هویت و عضویت را سمت سرور کنترل می‌کنند. شناسه کاربر از فرم
پذیرفته نمی‌شود؛ با این حال یک عضو می‌تواند هزینه‌ای را به نام پرداخت‌کننده
دیگری ثبت کند و نام ثبت‌کننده برای حسابرسی حفظ می‌شود.
