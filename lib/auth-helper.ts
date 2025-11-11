import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySessionToken } from "./session";
import { Database } from "./supabase/database.types";

/**
 * Authenticate a request using pm_session cookie (passkey auth)
 * Returns userId and a Supabase client with service role access
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  userId: string;
  supabase: ReturnType<typeof createClient<Database>>;
} | null> {
  const token = request.cookies.get("pm_session")?.value;
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload?.uid) {
    return null;
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return {
    userId: payload.uid,
    supabase,
  };
}
