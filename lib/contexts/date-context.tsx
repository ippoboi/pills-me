"use client";

import { formatUTCToLocalDate, getUserTimezone } from "@/lib/utils/timezone";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useContext, useState } from "react";

interface DateContextType {
  date: string;
  timezone: string;
  isToday: boolean;
  onPreviousDay: () => void;
  onNextDay: () => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
}

const DateContext = createContext<DateContextType | null>(null);

export function useDateContext() {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error("useDateContext must be used within a DateProvider");
  }
  return context;
}

interface DateProviderProps {
  children: ReactNode;
}

export function DateProvider({ children }: DateProviderProps) {
  const queryClient = useQueryClient();
  const timezone = getUserTimezone();
  const [date, setDate] = useState(() => {
    // Initialize with today's date in user's timezone
    return formatUTCToLocalDate(new Date().toISOString(), timezone);
  });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const onPreviousDay = () => {
    // Create date in user's timezone, subtract 1 day, then format back
    const currentDate = new Date(date + "T12:00:00"); // Use noon to avoid DST issues
    currentDate.setDate(currentDate.getDate() - 1);
    const previousDate = currentDate.toISOString().split("T")[0];

    // Invalidate queries for the new date to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ["supplements", "today"] });
    setDate(previousDate);
  };

  const onNextDay = () => {
    // Create date in user's timezone, add 1 day, then format back
    const currentDate = new Date(date + "T12:00:00"); // Use noon to avoid DST issues
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDate = currentDate.toISOString().split("T")[0];
    const todayInUserTz = formatUTCToLocalDate(
      new Date().toISOString(),
      timezone
    );

    // Don't allow navigation beyond today in user's timezone
    if (nextDate <= todayInUserTz) {
      // Invalidate queries for the new date to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["supplements", "today"] });
      setDate(nextDate);
    }
  };

  const todayInUserTz = formatUTCToLocalDate(
    new Date().toISOString(),
    timezone
  );
  const isToday = date === todayInUserTz;

  const contextValue: DateContextType = {
    date,
    timezone,
    isToday,
    onPreviousDay,
    onNextDay,
    isFormOpen,
    setIsFormOpen,
  };

  return (
    <DateContext.Provider value={contextValue}>{children}</DateContext.Provider>
  );
}
