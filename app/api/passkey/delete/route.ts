import { createClient } from "@supabase/supabase-js";
import { logAuditEvent, getClientIp, getUserAgent } from "@/lib/audit-logger";

export async function POST(request: Request) {
  let userId: string | undefined;
  let credentialId: string | undefined;

  try {
    const { userId: userIdFromRequest, credentialId: credentialIdFromRequest } =
      await request.json();

    userId = userIdFromRequest;
    credentialId = credentialIdFromRequest;

    if (!userId || !credentialId) {
      throw new Error("userId and credentialId are required");
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Ensure ownership
    const { data: cred, error: findErr } = await supabase
      .from("passkeys")
      .select("id,user_id")
      .eq("credential_id", credentialId)
      .maybeSingle();
    if (findErr) throw new Error(findErr.message);
    if (!cred) throw new Error("Credential not found");
    if (cred.user_id !== userId) {
      throw new Error("Credential does not belong to user");
    }
    const { error: delErr } = await supabase
      .from("passkeys")
      .delete()
      .eq("id", cred.id);
    if (delErr) throw new Error(delErr.message);

    // Log successful deletion
    await logAuditEvent({
      userId,
      action: "passkey_delete",
      resourceType: "passkey",
      resourceId: credentialId,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: {
        deletedAt: new Date().toISOString(),
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    // Log failed deletion attempt
    if (userId && credentialId) {
      await logAuditEvent({
        userId,
        action: "passkey_delete",
        resourceType: "passkey",
        resourceId: credentialId,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        details: {
          success: "false",
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
