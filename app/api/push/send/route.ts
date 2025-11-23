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
  formatUTCToLocalDate,
  getLocalDayBoundariesInUTC,
} from "@/lib/utils/timezone";

// Time-of-day buckets already used across the project
const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  MORNING: "Morning",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  BEFORE_SLEEP: "Before Sleep",
};

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
    const supabase = await createClient();

    // Verify authentication - only authenticated users can send notifications
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { userId, payload } = body;

    // Validate required fields
    if (!userId || !payload) {
      return NextResponse.json(
        { error: "Missing required fields: userId and payload" },
        { status: 400 }
      );
    }

    // Validate payload structure
    if (!payload.title || !payload.body) {
      return NextResponse.json(
        { error: "Payload must include title and body" },
        { status: 400 }
      );
    }

    // For security, only allow users to send notifications to themselves
    // In a production app, you might want admin users to send to others
    if (userId !== user.id) {
      return NextResponse.json(
        { error: "You can only send notifications to yourself" },
        { status: 403 }
      );
    }

    // Send the notification
    const result = await sendNotification(
      userId,
      payload as NotificationPayload
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        sentCount: result.sentCount,
        message: `Notification sent to ${result.sentCount} device(s)`,
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to send notification" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in push notification API:", error);
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

    // For scheduled notifications triggered by Vercel Cron
    if (action === "scheduled") {
      // Verify cron secret for security
      // Vercel automatically sends CRON_SECRET in Authorization header as "Bearer <secret>"
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

      const timeOfDay = searchParams.get("timeOfDay") as TimeOfDay | null;

      if (
        !timeOfDay ||
        !["MORNING", "LUNCH", "DINNER", "BEFORE_SLEEP"].includes(timeOfDay)
      ) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message:
              'Missing or invalid "timeOfDay". Expected one of MORNING, LUNCH, DINNER, BEFORE_SLEEP.',
          },
          { status: 400 }
        );
      }

      // NOTE: For now we treat all cron jobs as running in UTC.
      // We use the existing time-of-day buckets (8,12,18,22) in UTC,
      // reusing the same mapping logic used elsewhere in the app.
      const timezone = "UTC";
      const now = new Date();
      const todayDate = formatUTCToLocalDate(now.toISOString(), timezone);
      const [startOfDay, endOfDay] = getLocalDayBoundariesInUTC(
        todayDate,
        timezone
      );

      const supabase = createServiceRoleSupabase();

      // 1) Fetch all active supplements that:
      //    - belong to any user
      //    - are active for "today" (based on UTC day range)
      //    - have a schedule matching this timeOfDay
      const { data: supplements, error: supplementsError } = await supabase
        .from("supplements")
        .select(
          `
          id,
          user_id,
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
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .lte("start_date", endOfDay)
        .or(`end_date.is.null,end_date.gte.${startOfDay}`)
        .eq("supplement_schedules.time_of_day", timeOfDay);

      if (supplementsError) {
        console.error(
          "[cron] Error fetching supplements for scheduled notifications:",
          supplementsError
        );
        return NextResponse.json(
          {
            error: "Internal Server Error",
            message: "Failed to fetch supplements for scheduled notifications",
          },
          { status: 500 }
        );
      }

      if (!supplements || supplements.length === 0) {
        return NextResponse.json({
          message: "No supplements found for scheduled notifications",
          timeOfDay,
        });
      }

      type SupplementRow = (typeof supplements)[number] & {
        supplement_schedules: { id: string; time_of_day: TimeOfDay }[];
      };

      const typedSupplements = supplements as SupplementRow[];

      const userIds = Array.from(
        new Set(typedSupplements.map((s) => s.user_id))
      );

      // 2) Load notification preferences for all involved users
      const { data: preferences, error: preferencesError } = await supabase
        .from("notification_preferences")
        .select(
          "user_id, system_notifications_enabled, supplement_reminders_enabled"
        )
        .in("user_id", userIds);

      if (preferencesError) {
        console.error(
          "[cron] Error fetching notification preferences:",
          preferencesError
        );
        return NextResponse.json(
          {
            error: "Internal Server Error",
            message: "Failed to fetch notification preferences",
          },
          { status: 500 }
        );
      }

      const prefsByUser = new Map<
        string,
        {
          system_notifications_enabled: boolean;
          supplement_reminders_enabled: boolean;
        }
      >();

      (preferences || []).forEach((p) => {
        prefsByUser.set(p.user_id, {
          system_notifications_enabled: p.system_notifications_enabled,
          supplement_reminders_enabled: p.supplement_reminders_enabled,
        });
      });

      // Filter out supplements for users who disabled notifications
      const supplementsWithPrefs = typedSupplements.filter((s) => {
        const prefs = prefsByUser.get(s.user_id);
        return (
          prefs?.system_notifications_enabled &&
          prefs?.supplement_reminders_enabled
        );
      });

      if (supplementsWithPrefs.length === 0) {
        return NextResponse.json({
          message:
            "No users with supplement reminders enabled for this timeOfDay",
          timeOfDay,
        });
      }

      // 3) Fetch today's adherence for all candidate (user, supplement, schedule)
      const supplementIds = Array.from(
        new Set(supplementsWithPrefs.map((s) => s.id))
      );
      const scheduleIds = Array.from(
        new Set(
          supplementsWithPrefs.flatMap((s) =>
            s.supplement_schedules.map((sc) => sc.id)
          )
        )
      );

      const { data: adherence, error: adherenceError } = await supabase
        .from("supplement_adherence")
        .select("user_id, supplement_id, schedule_id")
        .in("user_id", userIds)
        .in("supplement_id", supplementIds)
        .in("schedule_id", scheduleIds)
        .gte("taken_at", startOfDay)
        .lt("taken_at", endOfDay);

      if (adherenceError) {
        console.error(
          "[cron] Error fetching adherence for scheduled notifications:",
          adherenceError
        );
        return NextResponse.json(
          {
            error: "Internal Server Error",
            message: "Failed to fetch adherence for scheduled notifications",
          },
          { status: 500 }
        );
      }

      const takenSet = new Set(
        (adherence || []).map(
          (a) => `${a.user_id}-${a.supplement_id}-${a.schedule_id}`
        )
      );

      // 4) Group due reminders by user and send notifications
      const notificationsByUser = new Map<
        string,
        { supplementId: string; supplementName: string; scheduleId: string }[]
      >();

      for (const supplement of supplementsWithPrefs) {
        for (const schedule of supplement.supplement_schedules) {
          const key = `${supplement.user_id}-${supplement.id}-${schedule.id}`;
          if (takenSet.has(key)) {
            continue; // already marked as taken today
          }

          if (schedule.time_of_day !== timeOfDay) continue;

          if (!notificationsByUser.has(supplement.user_id)) {
            notificationsByUser.set(supplement.user_id, []);
          }

          notificationsByUser.get(supplement.user_id)!.push({
            supplementId: supplement.id,
            supplementName: supplement.name,
            scheduleId: schedule.id,
          });
        }
      }

      if (notificationsByUser.size === 0) {
        return NextResponse.json({
          message: "No due reminders for this timeOfDay",
          timeOfDay,
        });
      }

      const timeOfDayLabel = TIME_OF_DAY_LABELS[timeOfDay] ?? timeOfDay;

      let totalNotifications = 0;

      // Send one aggregated notification per user for this time-of-day
      for (const [userId, items] of notificationsByUser.entries()) {
        const first = items[0];
        const count = items.length;

        const body =
          count === 1
            ? `Time to take your ${timeOfDayLabel.toLowerCase()} dose of ${
                first.supplementName
              }.`
            : `You have ${count} ${timeOfDayLabel.toLowerCase()} supplements to take today.`;

        const payload: NotificationPayload = {
          title: `Time for your ${timeOfDayLabel} supplements`,
          body,
          // Default URL is /todos; service worker will route appropriately
          data: {
            timeOfDay,
            // Provide the first supplement ID for smarter routing if needed
            supplementId: first.supplementId,
            scheduleIds: items.map((i) => i.scheduleId),
          },
          tag: `supplement-reminder-${timeOfDay.toLowerCase()}`,
        };

        const result = await sendNotification(userId, payload);
        if (result.success && (result.sentCount || 0) > 0) {
          totalNotifications += result.sentCount || 0;
        }
      }

      return NextResponse.json({
        message: "Scheduled notifications processed",
        timeOfDay,
        usersWithReminders: notificationsByUser.size,
        totalNotificationsSent: totalNotifications,
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
