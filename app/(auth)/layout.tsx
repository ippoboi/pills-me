import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side check: if user is already authenticated, redirect to todos
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("pm_session")?.value;

  if (sessionCookie) {
    const payload = await verifySessionToken(sessionCookie);
    if (payload?.uid) {
      // User is authenticated, redirect to todos
      redirect("/todos");
    }
  }

  // User is not authenticated, show auth pages
  return <>{children}</>;
}
