import { generateRegistrationOptions } from "@simplewebauthn/server";
import { createClient } from "@supabase/supabase-js";
import { getDefaultRegistrationOptions, getRPConfig } from "@/lib/webauthn";
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
    const { userId, userName, userDisplayName } = await request.json();
    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    const { rpID, rpName } = getRPConfig();

    // Supabase admin client (service role) to list existing credentials for excludeCredentials
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existing, error: listErr } = await supabase
      .from("passkeys")
      .select("credential_id, transports")
      .eq("user_id", userId);
    if (listErr) {
      throw new Error(listErr.message);
    }

    const excludeCredentials =
      existing?.map((c) => ({
        id: c.credential_id as string,
      })) || [];

    const options = await generateRegistrationOptions({
      rpID,
      rpName,
      timeout: getDefaultRegistrationOptions().timeout,
      attestationType: "none",
      userID: Buffer.from(userId, "utf-8"),
      userName: userName || userId,
      userDisplayName: userDisplayName || userId,
      authenticatorSelection:
        getDefaultRegistrationOptions().authenticatorSelection,
      excludeCredentials,
      // Prefer ES256 only for broadest compatibility across runtimes
      supportedAlgorithmIDs: [-7, -257],
    });

    const expiresAt =
      Date.now() + (getDefaultRegistrationOptions().timeout || 60_000);

    // Store challenge
    const { error: upsertErr } = await supabase
      .from("passkey_challenges")
      .upsert({
        id: `${userId}:registration`,
        user_id: userId,
        flow: "registration",
        challenge: options.challenge,
        expires_at: new Date(expiresAt).toISOString(),
      });
    if (upsertErr) {
      throw new Error(upsertErr.message);
    }

    return Response.json(options);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
