import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validations";
import { connectDB } from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";
import {
  CONTACT_INBOX,
  isMailerConfigured,
  sendContactAcknowledgement,
  sendContactEmail,
} from "@/lib/mailer";

/** nodemailer needs the Node runtime; it does not run on the edge. */
export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

/**
 * Per-instance throttle. Not a distributed rate limiter, but enough to stop a
 * single client hammering the inbox, and it costs no infrastructure.
 */
declare global {
  var contactRateLimit: Map<string, number[]> | undefined;
}
const hits = (global.contactRateLimit ??= new Map<string, number[]>());

function recentHits(ip: string, now: number) {
  return (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = recentHits(ip, now);
  hits.set(ip, recent);
  return recent.length >= RATE_LIMIT_MAX;
}

/**
 * Counted only once a submission actually validates, so a visitor who mistypes
 * their email does not burn part of their quota on a request that never had a
 * chance of reaching the inbox.
 */
function recordAttempt(ip: string) {
  const now = Date.now();
  hits.set(ip, [...recentHits(ip, now), now]);

  // Opportunistic sweep so the map cannot grow without bound.
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hits.delete(key);
    }
  }
}

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "";

  try {
    const body = await req.json();

    // Honeypot: the field is hidden from humans, so anything in it is a bot.
    // Report success anyway — telling a spammer it failed invites a retry.
    if (typeof body?.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({
        success: true,
        message: "Message sent successfully! I will get back to you soon.",
      });
    }

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many messages sent. Please try again in a few minutes.",
        },
        { status: 429 }
      );
    }

    const validated = contactFormSchema.parse(body);
    recordAttempt(ip);

    const payload = {
      ...validated,
      meta: { submittedAt: new Date(), ip, userAgent },
    };

    // Deliver first: the email is what the visitor is actually promised. The
    // DB copy is a safety net and must not gate the response.
    let emailStatus: "sent" | "failed" | "skipped" = "skipped";
    let emailError = "";

    if (isMailerConfigured()) {
      try {
        await sendContactEmail(payload);
        emailStatus = "sent";
      } catch (error) {
        emailStatus = "failed";
        emailError = error instanceof Error ? error.message : "Unknown error";
        console.error("[contact] failed to deliver email:", emailError);
      }
    } else {
      console.warn(
        `[contact] SMTP not configured — message from ${validated.email} stored only. ` +
          `Set SMTP_USER / SMTP_PASSWORD to forward it to ${CONTACT_INBOX}.`
      );
    }

    let stored = false;
    try {
      await connectDB();
      await ContactMessage.create({
        ...validated,
        emailStatus,
        emailError,
        ip,
        userAgent,
      });
      stored = true;
    } catch (error) {
      console.error("[contact] failed to store message:", error);
    }

    // Nothing worked — be honest rather than showing a fake success screen.
    if (emailStatus !== "sent" && !stored) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not send your message right now. Please email me directly.",
        },
        { status: 502 }
      );
    }

    // Courtesy auto-reply; never let it affect the visitor's result.
    if (emailStatus === "sent") {
      void sendContactAcknowledgement(payload).catch((error) => {
        console.error("[contact] acknowledgement failed:", error);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully! I will get back to you soon.",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    console.error("[contact] unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
