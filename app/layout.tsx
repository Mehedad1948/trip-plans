import type { Metadata } from "next";
import "@fontsource-variable/vazirmatn";
import "./globals.css";

export const metadata: Metadata = {
  title: "از کویر تا مه | برنامه سفر شمال‌غرب ایران",
  description:
    "برنامه کامل سفر پنج‌روزه جاده‌ای از کاشان به تبریز، اردبیل، سرعین و جاده اسالم.",
  keywords: ["سفر ایران", "تبریز", "اردبیل", "جاده اسالم", "برنامه سفر"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="scroll-smooth">
      <body>{children}</body>
    </html>
  );
}
