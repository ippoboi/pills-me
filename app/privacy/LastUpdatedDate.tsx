"use client";

export function LastUpdatedDate() {
  return (
    <p className="mt-2 text-sm text-gray-800">
      Last updated:{" "}
      {new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
    </p>
  );
}
