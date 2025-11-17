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

    // Fetch notification preferences
    const { data: preferences, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", data.user.id)
      .maybeSingle();

    // Get supplements count
    const { count: supplementsCount, error: countError } = await supabase
      .from("supplements")
      .select("id", { count: "exact", head: true })
      .eq("user_id", data.user.id);

    // Get all adherence records to calculate day streak
    const { data: adherenceRecords, error: dayStreakError } = await supabase
      .from("supplement_adherence")
      .select("marked_at")
      .eq("user_id", data.user.id);

    // Calculate day streak
    let dayStreak = 0;
    if (adherenceRecords && adherenceRecords.length > 0) {
      // Extract unique dates from marked_at timestamps (normalize to YYYY-MM-DD)
      const uniqueDates = new Set<string>();
      adherenceRecords.forEach((record) => {
        const dateStr = new Date(record.marked_at).toISOString().split("T")[0];
        uniqueDates.add(dateStr);
      });

      // Sort dates in descending order (newest first)
      const sortedDates = Array.from(uniqueDates).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      );

      // Find the longest consecutive streak ending at the most recent date
      if (sortedDates.length > 0) {
        let currentStreak = 1;

        // Start from the most recent date and work backwards to find consecutive days
        for (let i = 0; i < sortedDates.length - 1; i++) {
          const currentDate = new Date(sortedDates[i]);
          const nextDate = new Date(sortedDates[i + 1]);

          // Calculate difference in days
          const diffTime = currentDate.getTime() - nextDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive day found, increment streak
            currentStreak++;
          } else {
            // Gap found, stop counting (we want the longest streak from the most recent date)
            break;
          }
        }

        // Check if the most recent date is today or yesterday (for active streak)
        const mostRecentDate = new Date(sortedDates[0]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        mostRecentDate.setHours(0, 0, 0, 0);

        // If the most recent date is today or yesterday, use currentStreak
        // Otherwise, the streak is broken (0)
        if (
          mostRecentDate.getTime() === today.getTime() ||
          mostRecentDate.getTime() === yesterday.getTime()
        ) {
          dayStreak = currentStreak;
        } else {
          // Streak is broken if last entry is more than 1 day ago
          dayStreak = 0;
        }
      }
    }

    if (prefsError) {
      console.error("Error fetching notification preferences:", prefsError);
    }
    if (countError) {
      console.error("Error fetching supplements count:", countError);
    }
    if (dayStreakError) {
      console.error("Error fetching adherence records:", dayStreakError);
    }

    return NextResponse.json({
      id: data.user.id,
      username: data.user.user_metadata?.username,
      displayName: data.user.user_metadata?.display_name,
      avatarUrl: null,
      notificationPreferences: preferences,
      supplementsCount: supplementsCount || 0,
      dayStreak: dayStreak,
    });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
