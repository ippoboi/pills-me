import DotGrid from "@/components/ui/DotGrid";
import { Navigation } from "@/components/ui/navigation";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-gray-100 text-gray-900 min-h-screen">
      <DotGrid fillViewport absolute zIndex={0} />
      <div className="relative z-10 min-h-screen">
        <Navigation />
        {children}
        <ProgressiveBlur position="bottom" height="25%" />
      </div>
    </div>
  );
}
