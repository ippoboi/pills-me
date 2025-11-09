/* Minimal app session token (signed) for username-less passkey auth.
 * Token format: base64url(JSON payload) + "." + base64url(HMAC-SHA256(payloadB64, secret))
 * Payload fields: { uid: string, iat: number, exp: number }
 * Uses Web Crypto API (available in Edge and modern Node).
 */

type SessionPayload = {
  uid: string;
  iat: number;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) {
    throw new Error("APP_SESSION_SECRET is not set");
  }
  return secret;
}

function toUint8Array(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

function base64urlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(binary)
      : Buffer.from(binary, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlDecode(input: string): Uint8Array {
  const b64 =
    input.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((input.length + 3) % 4);
  if (typeof atob !== "undefined") {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return Buffer.from(b64, "base64");
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const keyData = toUint8Array(secret);
  // Normalize to an ArrayBuffer to satisfy older TS/DOM lib types
  const buf = new ArrayBuffer(keyData.byteLength);
  new Uint8Array(buf).set(keyData);
  // @ts-ignore - global crypto exists in Node >= 18 and Edge runtimes
  return await crypto.subtle.importKey(
    "raw",
    buf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function hmacSha256(message: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  // @ts-ignore
  const sig = await crypto.subtle.sign("HMAC", key, toUint8Array(message));
  return base64urlEncode(sig);
}

export async function createSessionToken(
  userId: string,
  maxAgeSeconds = 60 * 60 * 24 * 7 // 7 days
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    uid: userId,
    iat: now,
    exp: now + maxAgeSeconds,
  };
  const payloadB64 = base64urlEncode(toUint8Array(JSON.stringify(payload)));
  const signature = await hmacSha256(payloadB64, getSecret());
  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  const expected = await hmacSha256(payloadB64, getSecret());
  if (signature !== expected) return null;
  try {
    const bytes = base64urlDecode(payloadB64);
    const json = new TextDecoder().decode(bytes);
    const payload = JSON.parse(json) as SessionPayload;
    if (typeof payload.uid !== "string" || typeof payload.exp !== "number")
      return null;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSessionCookie(
  token: string,
  maxAgeSeconds: number
): string {
  // Only add Secure in production or when any expected origin is https
  const shouldSecure =
    process.env.NODE_ENV === "production" ||
    (process.env.NEXT_PUBLIC_EXPECTED_ORIGIN || "")
      .split(",")
      .map((s) => s.trim())
      .some((o) => o.startsWith("https://"));
  const parts = [
    `pm_session=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (shouldSecure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}
