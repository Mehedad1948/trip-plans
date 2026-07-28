import type { SVGProps } from "react";

export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & {
  name:
    | "arrow"
    | "bag"
    | "calendar"
    | "car"
    | "check"
    | "clock"
    | "compass"
    | "food"
    | "image"
    | "map"
    | "moon"
    | "mountain"
    | "pin"
    | "route"
    | "shield"
    | "spark";
}) {
  const paths = {
    arrow: <path d="m15 18-6-6 6-6" />,
    bag: (
      <>
        <path d="M6 8h12l1 12H5L6 8Z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
      </>
    ),
    calendar: (
      <>
        <rect width="18" height="16" x="3" y="5" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    car: (
      <>
        <path d="m5 17-1-5 2-5h12l2 5-1 5H5Z" />
        <path d="M7 17v2M17 17v2M4 12h16" />
        <circle cx="7.5" cy="14.5" r=".5" fill="currentColor" />
        <circle cx="16.5" cy="14.5" r=".5" fill="currentColor" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    food: (
      <>
        <path d="M7 3v8M4 3v5c0 2 6 2 6 0V3M7 11v10M16 3v18M16 3c3 2 3 7 0 9" />
      </>
    ),
    image: (
      <>
        <rect width="18" height="16" x="3" y="4" rx="2" />
        <circle cx="9" cy="9" r="1.5" />
        <path d="m3 16 5-4 4 3 3-2 6 5" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
    mountain: (
      <>
        <path d="m3 19 6-10 4 6 2-3 6 7H3Z" />
        <path d="m7.8 11 1.5 1.5L11 11" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    route: (
      <>
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="6" r="2" />
        <path d="M8 18h3a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />
      </>
    ),
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    spark: (
      <>
        <path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3Z" />
        <path d="m18 15 .7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7L18 15Z" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
