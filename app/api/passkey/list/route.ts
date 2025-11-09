import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("passkeys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      throw new Error(error.message);
    }

    // Map DB columns to client fields for consistency
    const passkeys =
      data?.map((p) => ({
        id: p.id,
        credentialId: p.credential_id,
        userId: p.user_id,
        userName: p.user_name ?? undefined,
        userDisplayName: p.user_display_name ?? undefined,
        deviceInfo: p.device_info ?? undefined,
        createdAt: p.created_at,
        lastUsedAt: p.last_used_at ?? undefined,
      })) ?? [];

    return Response.json({ passkeys });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
