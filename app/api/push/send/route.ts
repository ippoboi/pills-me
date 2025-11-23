import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import {
  sendNotification,
  type NotificationPayload,
} from "@/app/actions/push-notifications";
import type { Database } from "@/lib/supabase/database.types";
import type { TimeOfDay } from "@/lib/types";
import { getEnvVar } from "@/lib/env-validation";
import {
  getLocalDayBoundariesInUTCForUser,
  getLocalDateForTimezone,
} from "@/lib/utils/timezone";
import {
  isWithinNotificationWindow,
  formatTimeOfDayLabel,
} from "@/lib/utils/notifications-time";

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

// POST endpoint for sending notifications
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, message, data } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Bad Request", message: "Title and message are required" },
        { status: 400 }
      );
    }

    // Create notification payload
    const payload: NotificationPayload = {
      title,
      body: message,
      data: data || {},
      tag: "manual-notification",
    };

    // Send notification to the current user
    const result = await sendNotification(user.id, payload);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Notification sent successfully",
        sentCount: result.sentCount,
      });
    } else {
      return NextResponse.json(
        {
          error: "Failed to send notification",
          message: result.error || "Unknown error occurred",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in push notification POST API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Example usage for scheduled notifications or webhooks
export async function GET(request: NextRequest) {
  try {
    // This could be used for health checks or scheduled notification triggers
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    if (action === "health") {
      return NextResponse.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
      });
    }

    // For scheduled notifications triggered by Supabase Cron (every 15 minutes)
    if (action === "scheduled") {
      // Verify cron secret for security
      const authHeader = request.headers.get("authorization");
      const expectedSecret = getEnvVar("CRON_SECRET");
      const expectedAuth = `Bearer ${expectedSecret}`;

      if (authHeader !== expectedAuth) {
        console.error("Unauthorized cron request - invalid secret");
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Invalid or missing cron secret",
          },
          { status: 401 }
        );
      }

      const now = new Date();
      const supabase = createServiceRoleSupabase();

      console.log(
        `[cron] Processing scheduled notifications at ${now.toISOString()}`
      );

      // 1) Fetch all users with notification preferences enabled
      const { data: enabledUsers, error: usersError } = await supabase
        .from("notification_preferences")
        .select(
          "user_id, timezone, system_notifications_enabled, supplement_reminders_enabled"
        )
        .eq("system_notifications_enabled", true)
        .eq("supplement_reminders_enabled", true);

      if (usersError) {
        console.error("[cron] Error fetching enabled users:", usersError);
        return NextResponse.json(
          {
            error: "Internal Server Error",
            message: "Failed to fetch enabled users",
          },
          { status: 500 }
        );
      }

      if (!enabledUsers || enabledUsers.length === 0) {
        return NextResponse.json({
          message: "No users with notifications enabled",
          processedUsers: 0,
        });
      }

      console.log(
        `[cron] Found ${enabledUsers.length} users with notifications enabled`
      );

      // 2) Process each user individually based on their timezone
      const userNotifications = new Map<
        string,
        {
          timeOfDay: TimeOfDay;
          localTime: string;
          supplements: Array<{
            supplementId: string;
            supplementName: string;
            scheduleId: string;
          }>;
        }
      >();

      for (const user of enabledUsers) {
        const userTimezone = user.timezone || "UTC";

        // Check if current time is within any notification window for this user
        const { timeOfDay, localTime } = isWithinNotificationWindow(
          now,
          userTimezone
        );

        if (!timeOfDay) {
          // Not within any notification window for this user
          continue;
        }

        console.log(
          `[cron] User ${user.user_id} (${userTimezone}): ${localTime} -> ${timeOfDay}`
        );

        // Get user's local date and day boundaries in UTC
        const localDate = getLocalDateForTimezone(userTimezone, now);
        const [startOfDay, endOfDay] = getLocalDayBoundariesInUTCForUser(
          localDate,
          userTimezone
        );

        // 3) Fetch active supplements for this user and timeOfDay
        const { data: supplements, error: supplementsError } = await supabase
          .from("supplements")
          .select(
            `
            id,
            name,
            status,
            deleted_at,
            start_date,
            end_date,
            supplement_schedules!inner (
              id,
              time_of_day
            )
          `
          )
          .eq("user_id", user.user_id)
          .eq("status", "ACTIVE")
          .is("deleted_at", null)
          .lte("start_date", endOfDay)
          .or(`end_date.is.null,end_date.gte.${startOfDay}`)
          .eq("supplement_schedules.time_of_day", timeOfDay);

        if (supplementsError) {
          console.error(
            `[cron] Error fetching supplements for user ${user.user_id}:`,
            supplementsError
          );
          continue;
        }

        if (!supplements || supplements.length === 0) {
          continue;
        }

        // 4) Check adherence for this user's supplements today
        const supplementScheduleIds = supplements.flatMap((s) =>
          s.supplement_schedules.map((sch) => sch.id)
        );

        const { data: adherenceRecords, error: adherenceError } = await supabase
          .from("supplement_adherence")
          .select("supplement_id, schedule_id")
          .eq("user_id", user.user_id)
          .in("schedule_id", supplementScheduleIds)
          .gte("taken_at", startOfDay)
          .lte("taken_at", endOfDay);

        if (adherenceError) {
          console.error(
            `[cron] Error fetching adherence for user ${user.user_id}:`,
            adherenceError
          );
          continue;
        }

        const takenMap = new Set(
          adherenceRecords?.map((a) => `${a.supplement_id}-${a.schedule_id}`)
        );

        // 5) Collect untaken supplements for this user
        const untakenSupplements: Array<{
          supplementId: string;
          supplementName: string;
          scheduleId: string;
        }> = [];

        supplements.forEach((supplement) => {
          supplement.supplement_schedules.forEach((schedule) => {
            if (schedule.time_of_day !== timeOfDay) return;

            const key = `${supplement.id}-${schedule.id}`;
            if (!takenMap.has(key)) {
              untakenSupplements.push({
                supplementId: supplement.id,
                supplementName: supplement.name,
                scheduleId: schedule.id,
              });
            }
          });
        });

        if (untakenSupplements.length > 0) {
          userNotifications.set(user.user_id, {
            timeOfDay,
            localTime,
            supplements: untakenSupplements,
          });
        }
      }

      // 6) Send notifications to users who have untaken supplements
      const sendPromises = Array.from(userNotifications.entries()).map(
        async ([userId, { timeOfDay, localTime, supplements }]) => {
          const timeOfDayLabel = formatTimeOfDayLabel(timeOfDay);
          let body = "";

          if (supplements.length === 1) {
            body = `Time to take your ${supplements[0].supplementName} (${timeOfDayLabel})`;
          } else {
            body = `Time to take ${
              supplements.length
            } supplements: ${supplements
              .map((s) => s.supplementName)
              .join(", ")} (${timeOfDayLabel})`;
          }

          const first = supplements[0];
          const payload: NotificationPayload = {
            title: `Time for your ${timeOfDayLabel} supplements`,
            body,
            data: {
              timeOfDay,
              supplementId: first.supplementId,
              scheduleIds: supplements.map((s) => s.scheduleId),
            },
            tag: `supplement-reminder-${timeOfDay.toLowerCase()}`,
          };

          const result = await sendNotification(userId, payload);
          return {
            userId,
            timeOfDay,
            localTime,
            supplementCount: supplements.length,
            success: result.success,
            error: result.error,
          };
        }
      );

      const results = await Promise.all(sendPromises);
      const successfulSends = results.filter((r) => r.success).length;

      console.log(
        `[cron] Processed ${enabledUsers.length} users, sent ${successfulSends} notifications`
      );

      // Log details for debugging
      results.forEach((result) => {
        if (result.success) {
          console.log(
            `[cron] ✓ Sent to user ${result.userId}: ${result.supplementCount} supplements at ${result.localTime} (${result.timeOfDay})`
          );
        } else {
          console.log(
            `[cron] ✗ Failed to send to user ${result.userId}: ${result.error}`
          );
        }
      });

      return NextResponse.json({
        message: "Per-user scheduled notifications processed",
        processedUsers: enabledUsers.length,
        sentCount: successfulSends,
        totalNotifications: results.length,
        details: results,
      });
    }

    return NextResponse.json(
      { error: "Invalid action parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in push notification GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
