import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDraftPlans } from "@/lib/hooks/use-draft-plans";
import type { LocalDraftPlan, LocalPlanItem } from "@/lib/types/planner";

const STORAGE_KEY = "pills-me-draft-plans";

// Mock localStorage
const mockStorage: Record<string, string> = {};

beforeEach(() => {
  // Clear mock storage
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);

  vi.spyOn(Storage.prototype, "getItem").mockImplementation(
    (key: string) => mockStorage[key] || null
  );
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(
    (key: string, value: string) => {
      mockStorage[key] = value;
    }
  );
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(
    (key: string) => {
      delete mockStorage[key];
    }
  );

  // Mock crypto.randomUUID
  let uuidCounter = 0;
  vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
    uuidCounter++;
    return `test-uuid-${uuidCounter}`;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useDraftPlans", () => {
  describe("initial state", () => {
    it("returns empty array when no drafts exist", () => {
      const { result } = renderHook(() => useDraftPlans());

      expect(result.current.drafts).toEqual([]);
    });

    it("loads existing drafts from localStorage", () => {
      const existingDrafts: LocalDraftPlan[] = [
        {
          id: "existing-1",
          name: "My Plan",
          notes: "Test notes",
          items: [],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];
      mockStorage[STORAGE_KEY] = JSON.stringify(existingDrafts);

      const { result } = renderHook(() => useDraftPlans());

      expect(result.current.drafts).toHaveLength(1);
      expect(result.current.drafts[0].name).toBe("My Plan");
    });
  });

  describe("createDraft", () => {
    it("creates new draft with correct structure", () => {
      const { result } = renderHook(() => useDraftPlans());

      let draftId: string;
      act(() => {
        draftId = result.current.createDraft("New Plan", "Some notes");
      });

      expect(draftId!).toBe("test-uuid-1");
      expect(result.current.drafts).toHaveLength(1);

      const draft = result.current.drafts[0];
      expect(draft.id).toBe("test-uuid-1");
      expect(draft.name).toBe("New Plan");
      expect(draft.notes).toBe("Some notes");
      expect(draft.items).toEqual([]);
      expect(draft.createdAt).toBeDefined();
      expect(draft.updatedAt).toBeDefined();
    });

    it("creates draft without notes when not provided", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan Without Notes");
      });

      const draft = result.current.drafts[0];
      expect(draft.name).toBe("Plan Without Notes");
      expect(draft.notes).toBeUndefined();
    });

    it("persists draft to localStorage", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Persisted Plan");
      });

      const stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe("Persisted Plan");
    });
  });

  describe("updateDraft", () => {
    it("updates draft name", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Original Name");
      });

      const draftId = result.current.drafts[0].id;

      act(() => {
        result.current.updateDraft(draftId, { name: "Updated Name" });
      });

      expect(result.current.drafts[0].name).toBe("Updated Name");
    });

    it("updates draft notes", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan", "Original notes");
      });

      const draftId = result.current.drafts[0].id;

      act(() => {
        result.current.updateDraft(draftId, { notes: "Updated notes" });
      });

      expect(result.current.drafts[0].notes).toBe("Updated notes");
    });

    it("updates updatedAt timestamp", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan");
      });

      const draftId = result.current.drafts[0].id;

      act(() => {
        result.current.updateDraft(draftId, {
          name: "New Name",
        });
      });

      // updatedAt should be present and be a valid ISO timestamp
      expect(result.current.drafts[0].updatedAt).toBeDefined();
      expect(typeof result.current.drafts[0].updatedAt).toBe("string");
      // Verify it's a valid ISO date string
      expect(new Date(result.current.drafts[0].updatedAt).toISOString()).toBe(
        result.current.drafts[0].updatedAt
      );
    });

    it("does nothing if draft not found", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan");
      });

      act(() => {
        result.current.updateDraft("non-existent-id", { name: "New Name" });
      });

      expect(result.current.drafts[0].name).toBe("Plan");
    });
  });

  describe("deleteDraft", () => {
    it("removes draft from list", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan 1");
        result.current.createDraft("Plan 2");
      });

      expect(result.current.drafts).toHaveLength(2);

      const draftIdToDelete = result.current.drafts[0].id;

      act(() => {
        result.current.deleteDraft(draftIdToDelete);
      });

      expect(result.current.drafts).toHaveLength(1);
      expect(result.current.drafts[0].name).toBe("Plan 2");
    });

    it("persists deletion to localStorage", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan to Delete");
      });

      const draftId = result.current.drafts[0].id;

      act(() => {
        result.current.deleteDraft(draftId);
      });

      const stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored).toHaveLength(0);
    });

    it("does nothing if draft not found", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan");
      });

      act(() => {
        result.current.deleteDraft("non-existent-id");
      });

      expect(result.current.drafts).toHaveLength(1);
    });
  });

  describe("addItem", () => {
    it("adds item to specified draft", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("My Plan");
      });

      const draftId = result.current.drafts[0].id;
      const newItem: Omit<LocalPlanItem, "id"> = {
        name: "Vitamin D",
        brand: "Nature Made",
        servingsPerDay: 1,
        nutrients: [
          {
            nutrientId: "nutrient-1",
            nutrientSlug: "vitamin-d",
            amount: 1000,
            unit: "IU",
          },
        ],
      };

      act(() => {
        result.current.addItem(draftId, newItem);
      });

      const draft = result.current.drafts[0];
      expect(draft.items).toHaveLength(1);
      expect(draft.items[0].id).toBe("test-uuid-2");
      expect(draft.items[0].name).toBe("Vitamin D");
      expect(draft.items[0].brand).toBe("Nature Made");
      expect(draft.items[0].servingsPerDay).toBe(1);
      expect(draft.items[0].nutrients).toHaveLength(1);
    });

    it("updates draft updatedAt when adding item", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan");
      });

      const draftId = result.current.drafts[0].id;

      act(() => {
        result.current.addItem(draftId, {
          name: "Test Supplement",
          servingsPerDay: 1,
          nutrients: [],
        });
      });

      expect(result.current.drafts[0].updatedAt).toBeDefined();
    });

    it("does nothing if draft not found", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan");
      });

      act(() => {
        result.current.addItem("non-existent-id", {
          name: "Item",
          servingsPerDay: 1,
          nutrients: [],
        });
      });

      expect(result.current.drafts[0].items).toHaveLength(0);
    });
  });

  describe("updateItem", () => {
    it("updates item properties", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan");
      });

      const draftId = result.current.drafts[0].id;

      act(() => {
        result.current.addItem(draftId, {
          name: "Original Name",
          servingsPerDay: 1,
          nutrients: [],
        });
      });

      const itemId = result.current.drafts[0].items[0].id;

      act(() => {
        result.current.updateItem(draftId, itemId, {
          name: "Updated Name",
          servingsPerDay: 2,
        });
      });

      const item = result.current.drafts[0].items[0];
      expect(item.name).toBe("Updated Name");
      expect(item.servingsPerDay).toBe(2);
    });

    it("updates item nutrients", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan");
      });

      const draftId = result.current.drafts[0].id;

      act(() => {
        result.current.addItem(draftId, {
          name: "Supplement",
          servingsPerDay: 1,
          nutrients: [],
        });
      });

      const itemId = result.current.drafts[0].items[0].id;

      act(() => {
        result.current.updateItem(draftId, itemId, {
          nutrients: [
            {
              nutrientId: "nutrient-1",
              nutrientSlug: "vitamin-c",
              amount: 500,
              unit: "mg",
            },
          ],
        });
      });

      expect(result.current.drafts[0].items[0].nutrients).toHaveLength(1);
      expect(result.current.drafts[0].items[0].nutrients[0].amount).toBe(500);
    });

    it("does nothing if draft not found", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan");
      });

      const draftId = result.current.drafts[0].id;

      act(() => {
        result.current.addItem(draftId, {
          name: "Item",
          servingsPerDay: 1,
          nutrients: [],
        });
      });

      act(() => {
        result.current.updateItem("non-existent-draft", "item-id", {
          name: "New Name",
        });
      });

      expect(result.current.drafts[0].items[0].name).toBe("Item");
    });

    it("does nothing if item not found", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan");
      });

      const draftId = result.current.drafts[0].id;

      act(() => {
        result.current.addItem(draftId, {
          name: "Item",
          servingsPerDay: 1,
          nutrients: [],
        });
      });

      act(() => {
        result.current.updateItem(draftId, "non-existent-item", {
          name: "New Name",
        });
      });

      expect(result.current.drafts[0].items[0].name).toBe("Item");
    });
  });

  describe("removeItem", () => {
    it("removes item from draft", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan");
      });

      const draftId = result.current.drafts[0].id;

      act(() => {
        result.current.addItem(draftId, {
          name: "Item 1",
          servingsPerDay: 1,
          nutrients: [],
        });
        result.current.addItem(draftId, {
          name: "Item 2",
          servingsPerDay: 1,
          nutrients: [],
        });
      });

      expect(result.current.drafts[0].items).toHaveLength(2);

      const itemIdToRemove = result.current.drafts[0].items[0].id;

      act(() => {
        result.current.removeItem(draftId, itemIdToRemove);
      });

      expect(result.current.drafts[0].items).toHaveLength(1);
      expect(result.current.drafts[0].items[0].name).toBe("Item 2");
    });

    it("updates draft updatedAt when removing item", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan");
      });

      const draftId = result.current.drafts[0].id;

      act(() => {
        result.current.addItem(draftId, {
          name: "Item",
          servingsPerDay: 1,
          nutrients: [],
        });
      });

      const itemId = result.current.drafts[0].items[0].id;

      act(() => {
        result.current.removeItem(draftId, itemId);
      });

      expect(result.current.drafts[0].updatedAt).toBeDefined();
    });

    it("does nothing if draft not found", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan");
      });

      const draftId = result.current.drafts[0].id;

      act(() => {
        result.current.addItem(draftId, {
          name: "Item",
          servingsPerDay: 1,
          nutrients: [],
        });
      });

      act(() => {
        result.current.removeItem("non-existent-draft", "item-id");
      });

      expect(result.current.drafts[0].items).toHaveLength(1);
    });

    it("does nothing if item not found", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan");
      });

      const draftId = result.current.drafts[0].id;

      act(() => {
        result.current.addItem(draftId, {
          name: "Item",
          servingsPerDay: 1,
          nutrients: [],
        });
      });

      act(() => {
        result.current.removeItem(draftId, "non-existent-item");
      });

      expect(result.current.drafts[0].items).toHaveLength(1);
    });
  });

  describe("getDraft", () => {
    it("returns draft by id", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan 1");
        result.current.createDraft("Plan 2");
      });

      const draft = result.current.getDraft(result.current.drafts[0].id);

      expect(draft).toBeDefined();
      expect(draft?.name).toBe("Plan 1");
    });

    it("returns undefined if draft not found", () => {
      const { result } = renderHook(() => useDraftPlans());

      act(() => {
        result.current.createDraft("Plan");
      });

      const draft = result.current.getDraft("non-existent-id");

      expect(draft).toBeUndefined();
    });
  });

  describe("persistence", () => {
    it("drafts are saved to localStorage on every change", () => {
      const { result } = renderHook(() => useDraftPlans());

      // Create draft
      act(() => {
        result.current.createDraft("Plan");
      });

      let stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored).toHaveLength(1);

      // Add item
      act(() => {
        result.current.addItem(result.current.drafts[0].id, {
          name: "Item",
          servingsPerDay: 1,
          nutrients: [],
        });
      });

      stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored[0].items).toHaveLength(1);

      // Update item
      act(() => {
        result.current.updateItem(
          result.current.drafts[0].id,
          result.current.drafts[0].items[0].id,
          { name: "Updated Item" }
        );
      });

      stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored[0].items[0].name).toBe("Updated Item");

      // Remove item
      act(() => {
        result.current.removeItem(
          result.current.drafts[0].id,
          result.current.drafts[0].items[0].id
        );
      });

      stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored[0].items).toHaveLength(0);

      // Delete draft
      act(() => {
        result.current.deleteDraft(result.current.drafts[0].id);
      });

      stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored).toHaveLength(0);
    });

    it("handles corrupted localStorage gracefully", () => {
      mockStorage[STORAGE_KEY] = "invalid json {{{";

      const { result } = renderHook(() => useDraftPlans());

      // Should return empty array instead of throwing
      expect(result.current.drafts).toEqual([]);
    });
  });
});
