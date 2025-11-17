export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="text-8xl md:text-9xl font-medium text-blue-600 tabular-nums">
          0%
        </div>
      </div>
    </div>
  );
}
