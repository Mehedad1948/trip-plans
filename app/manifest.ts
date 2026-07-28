import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "از کویر تا مه | برنامه سفر گروهی",
    short_name: "از کویر تا مه",
    description:
      "برنامه سفر گروهی، گفتگو، وسایل و تسویه هزینه‌های سفر شمال‌غرب ایران.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#424874",
    lang: "fa",
    dir: "rtl",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
