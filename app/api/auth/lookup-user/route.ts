import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return Response.json({ error: "Username is required" }, { status: 400 });
    }

    // Use service role to query auth.users
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

    // List all anonymous users and filter by username in metadata
    // Note: This is not efficient for large user bases, consider indexing
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      throw error;
    }

    // Find user with matching username in metadata
    const user = data.users.find((u) => u.user_metadata?.username === username);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ userId: user.id });
  } catch (error) {
    console.error("User lookup error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
