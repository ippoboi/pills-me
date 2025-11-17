import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/session";
import { ConditionalDotGrid } from "@/components/ui/conditional-dot-grid";
import { ConditionalHeaders } from "@/components/ui/conditional-headers";
import { ConditionalNavigation } from "@/components/ui/conditional-navigation";
import { ConditionalProgressiveBlur } from "@/components/ui/conditional-progressive-blur";
import { DateProvider } from "@/lib/contexts/date-context";
import { SupplementToolsProvider } from "@/lib/contexts/supplement-tools-context";
import NotificationScheduler from "@/components/notification-scheduler";

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-gray-100 text-gray-900 min-h-screen">
      <ConditionalDotGrid />
      <ConditionalNavigation />
      <ConditionalHeaders />

      <div className="relative z-10 min-h-screen">{children}</div>

      <ConditionalProgressiveBlur />
    </div>
  );
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("pm_session")?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  const payload = await verifySessionToken(sessionCookie);
  if (!payload?.uid) {
    redirect("/login");
  }

  return (
    <DateProvider>
      <SupplementToolsProvider>
        <NotificationScheduler />
        <LayoutContent>{children}</LayoutContent>
      </SupplementToolsProvider>
    </DateProvider>
  );
}
