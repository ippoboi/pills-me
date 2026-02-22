"use client";

import { useState, useEffect, useCallback } from "react";
import type { LocalDraftPlan, LocalPlanItem } from "@/lib/types/planner";

const STORAGE_KEY = "pills-me-draft-plans";

/**
 * Load drafts from localStorage
 */
function loadDrafts(): LocalDraftPlan[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as LocalDraftPlan[];
  } catch {
    // Handle corrupted localStorage gracefully
    return [];
  }
}

/**
 * Save drafts to localStorage
 */
function saveDrafts(drafts: LocalDraftPlan[]): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

/**
 * Hook for managing draft supplement plans in localStorage
 */
export function useDraftPlans() {
  const [drafts, setDrafts] = useState<LocalDraftPlan[]>([]);

  // Load drafts from localStorage on mount
  useEffect(() => {
    setDrafts(loadDrafts());
  }, []);

  // Persist drafts to localStorage whenever they change
  useEffect(() => {
    saveDrafts(drafts);
  }, [drafts]);

  /**
   * Create a new draft plan
   * @param name Plan name
   * @param notes Optional notes
   * @returns The new draft ID
   */
  const createDraft = useCallback((name: string, notes?: string): string => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newDraft: LocalDraftPlan = {
      id,
      name,
      notes,
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    setDrafts((prev) => [...prev, newDraft]);

    return id;
  }, []);

  /**
   * Update a draft's name or notes
   */
  const updateDraft = useCallback(
    (id: string, updates: Partial<Pick<LocalDraftPlan, "name" | "notes">>): void => {
      setDrafts((prev) =>
        prev.map((draft) => {
          if (draft.id !== id) {
            return draft;
          }
          return {
            ...draft,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  /**
   * Delete a draft
   */
  const deleteDraft = useCallback((id: string): void => {
    setDrafts((prev) => prev.filter((draft) => draft.id !== id));
  }, []);

  /**
   * Add an item to a draft
   */
  const addItem = useCallback(
    (draftId: string, item: Omit<LocalPlanItem, "id">): void => {
      const itemId = crypto.randomUUID();

      setDrafts((prev) =>
        prev.map((draft) => {
          if (draft.id !== draftId) {
            return draft;
          }
          return {
            ...draft,
            items: [...draft.items, { ...item, id: itemId }],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  /**
   * Update an item in a draft
   */
  const updateItem = useCallback(
    (draftId: string, itemId: string, updates: Partial<LocalPlanItem>): void => {
      setDrafts((prev) =>
        prev.map((draft) => {
          if (draft.id !== draftId) {
            return draft;
          }
          const itemIndex = draft.items.findIndex((item) => item.id === itemId);
          if (itemIndex === -1) {
            return draft;
          }
          const updatedItems = [...draft.items];
          updatedItems[itemIndex] = { ...updatedItems[itemIndex], ...updates };
          return {
            ...draft,
            items: updatedItems,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  /**
   * Remove an item from a draft
   */
  const removeItem = useCallback((draftId: string, itemId: string): void => {
    setDrafts((prev) =>
      prev.map((draft) => {
        if (draft.id !== draftId) {
          return draft;
        }
        const filteredItems = draft.items.filter((item) => item.id !== itemId);
        // Only update if an item was actually removed
        if (filteredItems.length === draft.items.length) {
          return draft;
        }
        return {
          ...draft,
          items: filteredItems,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  /**
   * Get a specific draft by ID
   */
  const getDraft = useCallback(
    (id: string): LocalDraftPlan | undefined => {
      return drafts.find((draft) => draft.id === id);
    },
    [drafts]
  );

  return {
    drafts,
    createDraft,
    updateDraft,
    deleteDraft,
    addItem,
    updateItem,
    removeItem,
    getDraft,
  };
}
