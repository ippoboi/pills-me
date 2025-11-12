import { createClient } from "@supabase/supabase-js";

export interface AuditLogEntry {
  userId: string;
  action:
    | "passkey_register"
    | "passkey_authenticate"
    | "passkey_delete"
    | "passkey_register_failed"
    | "passkey_authenticate_failed";
  resourceType: "passkey";
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, string>;
}

/**
 * Centralized audit logging function for HIPAA/Financial compliance
 * Logs all passkey operations to the audit_logs table
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    // Use service role for audit logging to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("audit_logs").insert({
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      details: entry.details || {},
    });

    if (error) {
      // Log the error but don't throw - audit logging should not break the main flow
      console.error("[Audit Logger] Failed to log audit event:", error);
    }
  } catch (error) {
    // Catch any unexpected errors
    console.error("[Audit Logger] Unexpected error:", error);
  }
}

/**
 * Helper function to extract IP address from request
 */
export function getClientIp(request: Request): string | undefined {
  // Check common headers for real IP (works with proxies/load balancers)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback - might not be available in all environments
  return request.headers.get("cf-connecting-ip") || undefined;
}

/**
 * Helper function to get user agent from request
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get("user-agent") || undefined;
}
