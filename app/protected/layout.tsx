import { ConditionalDotGrid } from "@/components/ui/conditional-dot-grid";
import { ConditionalNavigation } from "@/components/ui/conditional-navigation";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-gray-100 text-gray-900 min-h-screen">
      <ConditionalDotGrid />
      <div className="relative z-10 min-h-screen">
        <ConditionalNavigation />
        {children}
        <ProgressiveBlur position="bottom" height="25%" />
      </div>
    </div>
  );
}
