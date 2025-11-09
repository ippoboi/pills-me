import { NextResponse } from "next/server";

export async function POST() {
  // Clear pm_session cookie
  const shouldSecure =
    process.env.NODE_ENV === "production" ||
    (process.env.NEXT_PUBLIC_EXPECTED_ORIGIN || "")
      .split(",")
      .map((s) => s.trim())
      .some((o) => o.startsWith("https://"));

  const parts = [
    "pm_session=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];
  if (shouldSecure) parts.push("Secure");

  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", parts.join("; "));
  return res;
}
