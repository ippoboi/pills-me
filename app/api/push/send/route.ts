import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendNotification,
  type NotificationPayload,
} from "@/app/actions/push-notifications";

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

    // For scheduled notifications, you might check for due reminders
    if (action === "scheduled") {
      // TODO: Implement scheduled notification logic
      // This would typically:
      // 1. Query for users with due supplement reminders
      // 2. Send notifications to those users
      // 3. Update reminder status in database

      return NextResponse.json({
        message: "Scheduled notifications not implemented yet",
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
