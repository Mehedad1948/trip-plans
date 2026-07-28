import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import {
  LANDING_IMAGE,
  PRIMARY_COLOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site-config";
import "@fontsource-variable/vazirmatn";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  applicationName: SITE_NAME,
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: ["سفر ایران", "تبریز", "اردبیل", "جاده اسالم", "برنامه سفر"],
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: LANDING_IMAGE, alt: "نمایی از شهر تبریز" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [LANDING_IMAGE],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  icons: {
    apple: "/pwa-icon-192.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: PRIMARY_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="scroll-smooth">
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
