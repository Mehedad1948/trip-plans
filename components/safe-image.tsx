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
  className,
  fallbackLabel = "تصویر در دسترس نیست",
  quietFallback = false,
  onError,
  onLoad,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div
        className={`absolute inset-0 bg-[linear-gradient(145deg,#DCD6F7,#A6B1E1)] ${
          quietFallback
            ? ""
            : "flex flex-col items-center justify-center gap-2 px-6 text-center text-sm font-medium text-[#424874]/70"
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
      className={`${className ?? ""} ${loaded ? "opacity-100" : "opacity-0"}`}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      {...props}
    />
  );
}
