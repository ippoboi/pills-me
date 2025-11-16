"use client";

import React, { createContext, useContext, useState } from "react";
import { SupplementResponse, SupplementInput } from "@/lib/types/supplements";
import {
  useEditSupplement,
  useSoftDeleteSupplement,
  useRefillSupplement,
} from "../hooks";

interface SupplementToolsContextType {
  currentSupplement: SupplementResponse | null;
  setCurrentSupplement: (supplement: SupplementResponse | null) => void;
  handleEdit: (supplementId: string, data?: Partial<SupplementInput>) => void;
  handleDelete: (supplementId: string) => void;
  handleRefill: (supplementId: string, amount: number) => void;
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

  // Initialize hooks at the top level
  const { mutate: editSupplement } = useEditSupplement();
  const { mutate: deleteSupplement } = useSoftDeleteSupplement();
  const { mutate: refillSupplement } = useRefillSupplement();

  const handleEdit = (
    supplementId: string,
    data?: Partial<SupplementInput>
  ) => {
    if (data) {
      editSupplement({ supplementId, data });
    } else {
      // TODO: Open edit form/modal to collect data
      console.log("Edit supplement:", supplementId, "- data collection needed");
    }
  };

  const handleDelete = (supplementId: string) => {
    deleteSupplement(supplementId);
  };

  const handleRefill = (supplementId: string, amount: number) => {
    refillSupplement({ supplementId, amount });
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
