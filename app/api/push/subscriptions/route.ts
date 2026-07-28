import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  removePushSubscription,
  savePushSubscription,
} from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function validEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4096) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      endpoint?: unknown;
      keys?: { p256dh?: unknown; auth?: unknown };
    };
    const p256dh = body.keys?.p256dh;
    const auth = body.keys?.auth;

    if (
      !validEndpoint(body.endpoint) ||
      typeof p256dh !== "string" ||
      !p256dh ||
      p256dh.length > 1024 ||
      typeof auth !== "string" ||
      !auth ||
      auth.length > 1024
    ) {
      return NextResponse.json(
        { error: "Invalid subscription." },
        { status: 400 },
      );
    }

    await savePushSubscription(user.id, {
      endpoint: body.endpoint,
      p256dh,
      auth,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { endpoint?: unknown };
    if (!validEndpoint(body.endpoint)) {
      return NextResponse.json(
        { error: "Invalid subscription." },
        { status: 400 },
      );
    }
    await removePushSubscription(user.id, body.endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }
}
