"use client";

import React, { createContext, useContext, useState } from "react";
import { SupplementResponse } from "@/lib/types/supplements";

interface SupplementToolsContextType {
  currentSupplement: SupplementResponse | null;
  setCurrentSupplement: (supplement: SupplementResponse | null) => void;
  handleEdit: (supplementId: string) => void;
  handleDelete: (supplementId: string) => void;
  handleRefill: (supplementId: string) => void;
  handleNewCycle: (supplementId: string) => void;
}

const SupplementToolsContext = createContext<
  SupplementToolsContextType | undefined
>(undefined);

export function SupplementToolsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentSupplement, setCurrentSupplement] =
    useState<SupplementResponse | null>(null);

  const handleEdit = (supplementId: string) => {
    // TODO: Implement edit functionality
    console.log("Edit supplement:", supplementId);
  };

  const handleDelete = (supplementId: string) => {
    // TODO: Implement delete functionality
    console.log("Delete supplement:", supplementId);
  };

  const handleRefill = (supplementId: string) => {
    // TODO: Implement refill functionality
    console.log("Refill supplement:", supplementId);
  };

  const handleNewCycle = (supplementId: string) => {
    // TODO: Implement new cycle functionality
    console.log("Start new cycle for supplement:", supplementId);
  };

  const value: SupplementToolsContextType = {
    currentSupplement,
    setCurrentSupplement,
    handleEdit,
    handleDelete,
    handleRefill,
    handleNewCycle,
  };

  return (
    <SupplementToolsContext.Provider value={value}>
      {children}
    </SupplementToolsContext.Provider>
  );
}

export function useSupplementTools() {
  const context = useContext(SupplementToolsContext);
  if (context === undefined) {
    throw new Error(
      "useSupplementTools must be used within a SupplementToolsProvider"
    );
  }
  return context;
}
