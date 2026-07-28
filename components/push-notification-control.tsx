"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";

type SupportState = "checking" | "supported" | "unsupported" | "unconfigured";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

async function storeSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/push/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!response.ok) throw new Error("Could not store push subscription.");
}

export function PushNotificationControl() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const [support, setSupport] = useState<SupportState>(
    publicKey ? "checking" : "unconfigured",
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!publicKey) return;
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      const timeout = window.setTimeout(() => setSupport("unsupported"), 0);
      return () => window.clearTimeout(timeout);
    }

    let cancelled = false;
    navigator.serviceWorker.ready
      .then(async (registration) => {
        const current = await registration.pushManager.getSubscription();
        if (cancelled) return;
        setSubscription(current);
        setSupport("supported");
        if (current) await storeSubscription(current);
      })
      .catch(() => {
        if (!cancelled) setSupport("unsupported");
      });

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  async function toggleNotifications() {
    if (support !== "supported" || !publicKey || pending) return;
    setPending(true);
    setMessage("");

    try {
      if (subscription) {
        const response = await fetch("/api/push/subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!response.ok) throw new Error("Could not remove subscription.");
        await subscription.unsubscribe();
        setSubscription(null);
        setMessage("اعلان‌ها خاموش شد.");
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setMessage("اجازهٔ اعلان داده نشد.");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const nextSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        await storeSubscription(nextSubscription);
        setSubscription(nextSubscription);
        setMessage("اعلان پیام‌ها و هزینه‌ها فعال شد.");
      }
    } catch {
      setMessage("فعال‌سازی اعلان ممکن نشد؛ دوباره تلاش کنید.");
    } finally {
      setPending(false);
      window.setTimeout(() => setMessage(""), 4000);
    }
  }

  const configured = support === "supported";
  const title =
    support === "unconfigured"
      ? "کلیدهای اعلان روی سرور تنظیم نشده‌اند"
      : support === "unsupported"
        ? "مرورگر شما از اعلان وب پشتیبانی نمی‌کند"
        : subscription
          ? "خاموش کردن اعلان‌ها"
          : "فعال کردن اعلان پیام‌ها و هزینه‌ها";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleNotifications}
        disabled={!configured || pending}
        aria-label={title}
        aria-pressed={Boolean(subscription)}
        title={title}
        className="inline-flex size-9 items-center justify-center rounded-xl border border-black/[0.07] bg-white text-[#424874] outline-none transition-transform hover:bg-[#F7F7F9] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-[#424874]"
      >
        <Icon
          name={subscription ? "bell" : "bellOff"}
          className={`size-4 ${pending ? "animate-pulse" : ""}`}
        />
      </button>
      {message && (
        <p
          role="status"
          className="fixed left-4 top-20 z-[80] max-w-[calc(100vw-2rem)] rounded-xl bg-[#424874] px-4 py-3 text-xs font-medium text-white shadow-xl sm:absolute sm:left-0 sm:top-12 sm:w-64"
        >
          {message}
        </p>
      )}
    </div>
  );
}
