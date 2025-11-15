import { ConditionalDotGrid } from "@/components/ui/conditional-dot-grid";
import { ConditionalHeaders } from "@/components/ui/conditional-headers";
import { ConditionalNavigation } from "@/components/ui/conditional-navigation";
import { ConditionalProgressiveBlur } from "@/components/ui/conditional-progressive-blur";
import { DateProvider } from "@/lib/contexts/date-context";
import { SupplementToolsProvider } from "@/lib/contexts/supplement-tools-context";

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

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DateProvider>
      <SupplementToolsProvider>
        <LayoutContent>{children}</LayoutContent>
      </SupplementToolsProvider>
    </DateProvider>
  );
}
