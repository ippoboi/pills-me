import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySessionToken } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const cookie = (request.headers.get("cookie") || "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("pm_session="));
    if (!cookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const token = cookie.split("=")[1];
    const payload = await verifySessionToken(token);
    if (!payload?.uid) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabase.auth.admin.getUserById(payload.uid);
    if (error || !data?.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: data.user.id,
      username: data.user.user_metadata?.username,
      displayName: data.user.user_metadata?.display_name,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 400 }
    );
  }
}
