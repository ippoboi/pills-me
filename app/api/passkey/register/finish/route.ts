import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { getRPConfig } from "@/lib/webauthn";
import { logAuditEvent, getClientIp, getUserAgent } from "@/lib/audit-logger";
import { createClient } from "@supabase/supabase-js";
import { createSessionCookie, createSessionToken } from "@/lib/session";
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
  let userId: string | undefined;

  try {
    const {
      userId: userIdFromRequest,
      credential,
      userName,
      userDisplayName,
      deviceInfo,
    } = await request.json();

    userId = userIdFromRequest;

    if (!userId) {
      throw new Error("userId is required");
    }

    const { rpID, expectedOrigin } = getRPConfig();

    // If userName and userDisplayName are not provided by the client,
    // fetch them from Supabase Auth user metadata. If username is absent,
    // fall back to display_name for both fields for a cleaner UI.
    let finalUserName = userName;
    let finalUserDisplayName = userDisplayName;

    if (!finalUserName || !finalUserDisplayName) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(userId);

      if (userError || !userData?.user) {
        console.error("Failed to fetch user data:", userError);
      } else {
        const meta = userData.user.user_metadata || {};
        const display = meta.display_name || "User";
        const name = meta.username || display;
        finalUserName = finalUserName || name;
        finalUserDisplayName = finalUserDisplayName || display;
      }
    }

    // Verify WebAuthn attestation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Load challenge
    const { data: challengeRow, error: getErr } = await supabase
      .from("passkey_challenges")
      .select("*")
      .eq("id", `${userId}:registration`)
      .single();
    if (getErr) {
      throw new Error(getErr.message);
    }
    if (!challengeRow) {
      throw new Error("Challenge not found");
    }
    const expiresAt = new Date(challengeRow.expires_at).getTime();
    if (Date.now() > expiresAt) {
      await supabase
        .from("passkey_challenges")
        .delete()
        .eq("id", `${userId}:registration`);
      throw new Error("Challenge expired");
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    // Clean up challenge
    await supabase
      .from("passkey_challenges")
      .delete()
      .eq("id", `${userId}:registration`);

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error("Registration verification failed");
    }

    const {
      credential: {
        id: credentialId,
        publicKey: credentialPublicKey,
        counter,
        transports,
      },
      credentialBackedUp,
      credentialDeviceType,
    } = verification.registrationInfo;

    // ALWAYS log this during registration to debug storage
    let sample: string | undefined;
    try {
      const asBytes = Buffer.from(credentialPublicKey);
      sample = Array.from(asBytes.subarray(0, 12))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
    } catch {}
    console.log("[passkey][register/finish] STORING PUBLIC KEY", {
      type: typeof credentialPublicKey,
      byteLength:
        (credentialPublicKey as Uint8Array)?.byteLength ||
        (credentialPublicKey as Uint8Array)?.length,
      headHex: sample,
      looksCBORMap: sample?.startsWith("a5") || sample?.startsWith("a4"),
    });

    // Determine attachment
    const hasInternal = transports?.includes("internal");
    const isSingleDevice = credentialDeviceType === "singleDevice";
    const authenticatorAttachment =
      hasInternal || isSingleDevice ? "platform" : "cross-platform";

    // Ensure not duplicate
    const { data: existing, error: findErr } = await supabase
      .from("passkeys")
      .select("id")
      .eq("credential_id", credentialId)
      .maybeSingle();
    if (findErr) {
      throw new Error(findErr.message);
    }
    if (existing) {
      throw new Error("Credential already registered");
    }

    // Store credential - credentialPublicKey is Uint8Array COSE bytes
    // Supabase JS serializes Buffer to JSON, so convert to base64 string for storage
    const publicKeyB64 = Buffer.from(credentialPublicKey).toString("base64");

    const insertData = {
      user_id: userId,
      credential_id: credentialId,
      public_key: publicKeyB64,
      counter,
      transports: transports || [],
      user_name: finalUserName,
      user_display_name: finalUserDisplayName,
      authenticator_attachment: authenticatorAttachment,
      device_info: deviceInfo || {},
      backup_eligible: !!credentialBackedUp,
      backup_state: !!credentialBackedUp,
    };
    const { error: insErr } = await supabase
      .from("passkeys")
      .insert(insertData);
    if (insErr) {
      throw new Error(insErr.message);
    }

    // Initialize notification preferences with default values
    const { error: prefsErr } = await supabase
      .from("notification_preferences")
      .insert({
        user_id: userId,
        supplement_reminders_enabled: true,
        refill_reminders_enabled: true,
        app_updates_enabled: true,
        system_notifications_enabled: true,
      });
    if (prefsErr) {
      console.error("Failed to create notification preferences:", prefsErr);
      // Don't throw error - this is not critical for registration success
    }

    // Log successful registration
    if (verification.verified) {
      await logAuditEvent({
        userId,
        action: "passkey_register",
        resourceType: "passkey",
        resourceId: credentialId,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        details: {
          userName: finalUserName,
          userDisplayName: finalUserDisplayName,
          deviceInfo: JSON.stringify(deviceInfo),
          authenticatorAttachment,
          backupEligible: String(credentialBackedUp),
          backupState: String(credentialBackedUp),
        },
      });
    }

    // Create app session immediately so user does not need to authenticate again
    const maxAge = 60 * 60 * 24 * 7;
    const token = await createSessionToken(userId, maxAge);
    const res = NextResponse.json({ verified: true });
    res.headers.append("Set-Cookie", createSessionCookie(token, maxAge));
    return res;
  } catch (error) {
    // Log failed registration
    if (userId) {
      await logAuditEvent({
        userId,
        action: "passkey_register_failed",
        resourceType: "passkey",
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }

    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
