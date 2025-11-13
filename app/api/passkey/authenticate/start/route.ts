import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { createClient } from "@supabase/supabase-js";
import { getDefaultAuthenticationOptions, getRPConfig } from "@/lib/webauthn";
import { checkRateLimit } from "@/lib/rate-limiter";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Apply rate limiting for auth endpoints
  const rateLimitResult = await checkRateLimit(request, "auth");
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimitResult.retryAfter.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        },
      }
    );
  }
  try {
    // Discoverable authentication: no userId required

    const { rpID } = getRPConfig();

    const options = await generateAuthenticationOptions({
      rpID,
      timeout: getDefaultAuthenticationOptions().timeout,
      userVerification: getDefaultAuthenticationOptions().userVerification,
      // Critical: omit allowCredentials for discoverable login
    });

    const challengeToken =
      (globalThis.crypto?.randomUUID && globalThis.crypto.randomUUID()) ||
      Math.random().toString(36).slice(2);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const expiresAt =
      Date.now() + (getDefaultAuthenticationOptions().timeout || 60_000);

    const { error: upsertErr } = await supabase
      .from("passkey_challenges")
      .upsert({
        id: `${challengeToken}:authentication`,
        user_id: "discoverable", // not used for lookup
        flow: "authentication",
        challenge: options.challenge,
        expires_at: new Date(expiresAt).toISOString(),
      });
    if (upsertErr) {
      throw new Error(upsertErr.message);
    }

    return Response.json({ options, challengeToken });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
