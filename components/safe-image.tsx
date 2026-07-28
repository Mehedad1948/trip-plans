"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

import { Icon } from "@/components/icons";

type SafeImageProps = ImageProps & {
  fallbackLabel?: string;
  quietFallback?: boolean;
};

export function SafeImage({
  alt,
  fallbackLabel = "تصویر در دسترس نیست",
  quietFallback = false,
  onError,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`absolute inset-0 bg-[linear-gradient(145deg,#dfeae3,#a9c4b0)] ${
          quietFallback
            ? ""
            : "flex flex-col items-center justify-center gap-2 px-6 text-center text-sm font-medium text-emerald-950/70"
        }`}
        role="img"
        aria-label={`${fallbackLabel}: ${alt}`}
      >
        {!quietFallback && (
          <>
            <Icon name="image" className="size-7" />
            <span>{fallbackLabel}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}
