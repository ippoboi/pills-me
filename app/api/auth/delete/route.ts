import { authenticateRequest } from "@/lib/auth-helper";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate using pm_session cookie
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId, supabase } = auth;

    const { error: deleteError } = await supabase
      .from("passkeys")
      .delete()
      .eq("user_id", userId);
    if (deleteError) {
      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to delete user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete user" },
      { status: 500 }
    );
  }
}
