export const SITE_NAME = "از کویر تا مه";
export const SITE_TITLE = "از کویر تا مه | برنامه سفر شمال‌غرب ایران";
export const SITE_DESCRIPTION =
  "برنامه سفر پنج‌روزه جاده‌ای از کاشان تا شمال‌غرب ایران؛ همراه با برنامه روزانه، گفتگو، وسایل و هزینه‌های گروه.";
export const PRIMARY_COLOR = "#424874";
export const LANDING_IMAGE = "/tabriz.png";

const deploymentHost =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_URL = new URL(deploymentHost);
