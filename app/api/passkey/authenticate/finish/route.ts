import { getClientIp, getUserAgent, logAuditEvent } from "@/lib/audit-logger";
import { createClient } from "@supabase/supabase-js";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { getRPConfig } from "@/lib/webauthn";
import { createSessionCookie, createSessionToken } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let resolvedUserId: string | undefined;

  try {
    const { challengeToken, credential } = await request.json();

    if (!challengeToken) {
      throw new Error("challengeToken is required");
    }

    const { rpID, expectedOrigin } = getRPConfig();
    const debug =
      process.env.PM_DEBUG_AUTH === "1" || process.env.PM_DEBUG_AUTH === "true";

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Load challenge
    const { data: challengeRow, error: getErr } = await supabase
      .from("passkey_challenges")
      .select("*")
      .eq("id", `${challengeToken}:authentication`)
      .single();
    if (getErr) {
      throw new Error(getErr.message);
    }
    if (!challengeRow) throw new Error("Challenge not found");
    const expiresAt = new Date(challengeRow.expires_at).getTime();
    if (Date.now() > expiresAt) {
      await supabase
        .from("passkey_challenges")
        .delete()
        .eq("id", `${challengeToken}:authentication`);
      throw new Error("Challenge expired");
    }

    // To verify we need the stored credential's public key and counter
    // Look up by credential.id
    // Normalize to Base64URL. Some browsers may send standard base64 for
    // signature/id, and some environments may provide a raw UTF-8 string
    // (e.g. a UUID) for userHandle. The verifier expects proper base64url.
    const stripPadding = (s: string) => s.replace(/=+$/g, "");
    const ensureBase64UrlWithFormat = (value?: string) => {
      if (typeof value !== "string") return value as any;
      const candidate = stripPadding(value);
      // Quick path: if re-encoding a base64url-decoded buffer yields the same string,
      // treat it as already-valid base64url. Otherwise, encode the UTF-8 string.
      try {
        const decoded = Buffer.from(candidate, "base64url");
        const reencoded = decoded.toString("base64url");
        if (reencoded === candidate) {
          return { value: candidate, format: "base64url" as const };
        }
      } catch {
        // Not valid base64url, try legacy/base64 first (some browsers/drivers return this)
        try {
          const decoded = Buffer.from(value, "base64");
          return {
            value: decoded.toString("base64url"),
            format: "base64" as const,
          };
        } catch {
          // fall through to UTF-8 encode as a last resort
        }
      }
      return {
        value: Buffer.from(value, "utf-8").toString("base64url"),
        format: "utf8" as const,
      };
    };

    const idN = ensureBase64UrlWithFormat(credential?.id);
    const rawIdN = ensureBase64UrlWithFormat(credential?.rawId);
    const authDataN = ensureBase64UrlWithFormat(
      credential?.response?.authenticatorData
    );
    const clientDataN = ensureBase64UrlWithFormat(
      credential?.response?.clientDataJSON
    );
    const signatureN = ensureBase64UrlWithFormat(
      credential?.response?.signature
    );
    const userHandleN = ensureBase64UrlWithFormat(
      credential?.response?.userHandle
    );

    if (debug) {
      console.log("[passkey][authenticate/finish] input lengths", {
        id: credential?.id?.length,
        rawId: credential?.rawId?.length,
        authenticatorData: credential?.response?.authenticatorData?.length,
        clientDataJSON: credential?.response?.clientDataJSON?.length,
        signature: credential?.response?.signature?.length,
        userHandle: credential?.response?.userHandle?.length,
      });
      console.log("[passkey][authenticate/finish] normalized formats", {
        id: (idN as any)?.format,
        rawId: (rawIdN as any)?.format,
        authenticatorData: (authDataN as any)?.format,
        clientDataJSON: (clientDataN as any)?.format,
        signature: (signatureN as any)?.format,
        userHandle: (userHandleN as any)?.format,
      });
    }

    const normalizedCredential = {
      ...credential,
      id: (idN as any)?.value ?? idN,
      rawId: (rawIdN as any)?.value ?? rawIdN,
      response: {
        ...credential?.response,
        authenticatorData: (authDataN as any)?.value ?? authDataN,
        clientDataJSON: (clientDataN as any)?.value ?? clientDataN,
        signature: (signatureN as any)?.value ?? signatureN,
        userHandle: (userHandleN as any)?.value ?? userHandleN,
      },
    };

    const credentialIdString: string = normalizedCredential?.id;
    if (!credentialIdString) throw new Error("Missing credential id");

    const { data: storedCred, error: findErr } = await supabase
      .from("passkeys")
      .select("*")
      .eq("credential_id", credentialIdString)
      .maybeSingle();
    if (findErr) {
      throw new Error(findErr.message);
    }
    if (!storedCred) {
      // Clean up challenge on invalid credential
      await supabase
        .from("passkey_challenges")
        .delete()
        .eq("id", `${challengeToken}:authentication`);
      throw new Error("Credential not found");
    }
    resolvedUserId = storedCred.user_id as string;

    // public_key stored as base64 string
    const publicKeyBuf = Buffer.from(storedCred.public_key, "base64");
    const pkFormat = "base64";
    if (debug) {
      const head = Array.from(publicKeyBuf.subarray(0, 12))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
      const looksCBORMap = (publicKeyBuf[0] & 0xe0) === 0xa0;
      console.log("[passkey][authenticate/finish] stored public key", {
        format: pkFormat,
        byteLength: publicKeyBuf.byteLength,
        headHex: head,
        looksCBORMap,
      });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: normalizedCredential,
        expectedChallenge: challengeRow.challenge,
        expectedOrigin,
        expectedRPID: rpID,
        credential: {
          id: storedCred.credential_id,
          publicKey: new Uint8Array(publicKeyBuf),
          counter: storedCred.counter,
          transports: storedCred.transports || [],
        },
        requireUserVerification: false,
      });
    } catch (e: any) {
      if (debug) {
        console.error("[passkey][authenticate/finish] verify error", {
          message: e?.message,
          stack: e?.stack,
          name: e?.name,
        });
      }
      throw e;
    }

    // Clean up challenge
    await supabase
      .from("passkey_challenges")
      .delete()
      .eq("id", `${challengeToken}:authentication`);

    if (!verification.verified) {
      throw new Error("Authentication verification failed");
    }

    // Update counter if increased
    const newCounter = verification.authenticationInfo?.newCounter ?? 0;
    if (newCounter > storedCred.counter) {
      await supabase
        .from("passkeys")
        .update({ counter: newCounter, last_used_at: new Date().toISOString() })
        .eq("id", storedCred.id);
    }

    // Fetch user metadata for response
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(resolvedUserId);
    if (userError || !userData?.user) {
      throw new Error("Failed to fetch user data");
    }

    await logAuditEvent({
      userId: resolvedUserId,
      action: "passkey_authenticate",
      resourceType: "passkey",
      resourceId: storedCred.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: {
        credentialId: storedCred.credential_id,
        authenticatorAttachment: String(storedCred.authenticator_attachment),
        lastUsedAt: new Date().toISOString(),
      },
    });

    // Set app session cookie
    const maxAge = 60 * 60 * 24 * 7;
    const token = await createSessionToken(resolvedUserId, maxAge);
    const res = NextResponse.json({
      verified: true,
      user: {
        id: userData.user.id,
        username: userData.user.user_metadata?.username,
        displayName: userData.user.user_metadata?.display_name,
      },
    });
    res.headers.append("Set-Cookie", createSessionCookie(token, maxAge));
    return res;
  } catch (error) {
    // Log failed authentication
    if (resolvedUserId) {
      await logAuditEvent({
        userId: resolvedUserId,
        action: "passkey_authenticate_failed",
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
