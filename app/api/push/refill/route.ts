import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import { getEnvVar } from "@/lib/env-validation";
import type { Database } from "@/lib/supabase/database.types";
import {
  sendNotification,
  type NotificationPayload,
} from "@/app/actions/push-notifications";

function createServiceRoleSupabase() {
  return createServiceRoleClient<Database>(
    getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const expectedSecret = getEnvVar("CRON_SECRET");
    const expectedAuth = `Bearer ${expectedSecret}`;

    if (authHeader !== expectedAuth) {
      console.error("[refill] Unauthorized cron request - invalid secret");
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or missing cron secret",
        },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleSupabase();

    // 1) Find users who have refill reminders enabled
    const { data: preferences, error: prefsError } = await supabase
      .from("notification_preferences")
      .select(
        "user_id, system_notifications_enabled, refill_reminders_enabled"
      );

    if (prefsError) {
      console.error(
        "[refill] Error fetching notification preferences:",
        prefsError
      );
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to fetch notification preferences",
        },
        { status: 500 }
      );
    }

    const enabledUserIds =
      preferences
        ?.filter(
          (p) => p.system_notifications_enabled && p.refill_reminders_enabled
        )
        .map((p) => p.user_id) ?? [];

    if (enabledUserIds.length === 0) {
      return NextResponse.json({
        message: "No users with refill reminders enabled",
      });
    }

    // 2) Fetch supplements with low inventory for those users
    const { data: supplements, error: suppError } = await supabase
      .from("supplements")
      .select(
        "id, user_id, name, inventory_total, low_inventory_threshold, end_date, status, deleted_at"
      )
      .in("user_id", enabledUserIds)
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .is("end_date", null) // inventory tracking only for indefinite supplements
      .not("inventory_total", "is", null)
      .not("low_inventory_threshold", "is", null);

    if (suppError) {
      console.error("[refill] Error fetching supplements:", suppError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to fetch supplements for refill reminders",
        },
        { status: 500 }
      );
    }

    const lowInventorySupplements =
      supplements?.filter((s) => {
        const current = s.inventory_total ?? 0;
        const threshold = s.low_inventory_threshold ?? 0;
        return current <= threshold;
      }) ?? [];

    if (lowInventorySupplements.length === 0) {
      return NextResponse.json({
        message: "No low-inventory supplements found",
      });
    }

    // 3) Group low-inventory supplements by user
    const supplementsByUser = new Map<
      string,
      {
        id: string;
        name: string;
        inventory_total: number | null;
        low_inventory_threshold: number | null;
      }[]
    >();

    for (const s of lowInventorySupplements) {
      const list = supplementsByUser.get(s.user_id) ?? [];

      list.push({
        id: s.id,
        name: s.name,
        inventory_total: s.inventory_total,
        low_inventory_threshold: s.low_inventory_threshold,
      });

      supplementsByUser.set(s.user_id, list);
    }

    // 4) Send one aggregated refill notification per user
    let totalNotificationsSent = 0;
    const perUserResults: {
      userId: string;
      supplementCount: number;
      sentCount: number;
    }[] = [];

    for (const [userId, items] of supplementsByUser.entries()) {
      const count = items.length;
      const primary = items[0];
      const current = primary.inventory_total ?? 0;
      const threshold = primary.low_inventory_threshold ?? 0;

      const body =
        count === 1
          ? `You're running low on ${primary.name} (${current} left, threshold ${threshold}).`
          : `You're running low on ${count} supplements. ${primary.name} is at ${current} left.`;

      const payload: NotificationPayload = {
        title: "Time to refill your supplements",
        body,
        data: {
          supplementId: primary.id,
          lowInventoryCount: count,
        },
        tag: "refill-reminder",
      };

      const result = await sendNotification(userId, payload);
      const sentCount = result.sentCount ?? 0;

      totalNotificationsSent += sentCount;
      perUserResults.push({
        userId,
        supplementCount: count,
        sentCount,
      });
    }

    return NextResponse.json({
      message: "Refill notifications processed",
      usersWithLowInventory: supplementsByUser.size,
      totalNotificationsSent,
      details: perUserResults,
    });
  } catch (error) {
    console.error("[refill] Unexpected error in refill cron handler:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message:
          "An unexpected error occurred while processing refill reminders",
      },
      { status: 500 }
    );
  }
}
