"use client";

import { usePathname } from "next/navigation";
import TodosHeader from "@/components/protected/todos-header";
import SupplementsHeader from "@/components/protected/supplements-header";
import { useDateContext } from "@/lib/contexts/date-context";

export function ConditionalHeaders() {
  const pathname = usePathname();
  const dateContext = useDateContext();

  // Determine which header to show based on the current route
  const isTodosPage = pathname === "/todos";
  const isSupplementsPage = pathname === "/supplements";

  if (isTodosPage) {
    return (
      <TodosHeader
        date={dateContext.date}
        onTrackNew={() => dateContext.setIsFormOpen(true)}
        onPreviousDay={dateContext.onPreviousDay}
        onNextDay={dateContext.onNextDay}
        isToday={dateContext.isToday}
      />
    );
  }

  if (isSupplementsPage) {
    return (
      <SupplementsHeader onTrackNew={() => dateContext.setIsFormOpen(true)} />
    );
  }

  // No header for other routes
  return null;
}
