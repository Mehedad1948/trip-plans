"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => setInstallPrompt(null);

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!installPrompt) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await installPrompt.prompt();
        await installPrompt.userChoice;
        setInstallPrompt(null);
      }}
      aria-label="نصب برنامه سفر"
      title="نصب برنامه"
      className="inline-flex size-9 items-center justify-center rounded-xl border border-black/[0.07] bg-white text-[#424874] outline-none transition-transform active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#424874] md:hidden"
    >
      <Icon name="install" className="size-4" />
    </button>
  );
}
