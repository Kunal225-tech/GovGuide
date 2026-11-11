import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getSavedSchemes,
  saveScheme as apiSaveScheme,
  unsaveScheme as apiUnsaveScheme,
} from "@/services/savedSchemeApi";
import type { SavedSchemeItem } from "@/types/savedScheme";

export interface SavedSchemesContextType {
  savedItems: SavedSchemeItem[];
  savedSchemeIds: Set<string>;
  savedCount: number;
  isLoading: boolean;
  error: string | null;
  isSaved: (schemeId: string) => boolean;
  toggleSave: (schemeId: string) => Promise<boolean>;
  save: (schemeId: string) => Promise<boolean>;
  unsave: (schemeId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const SavedSchemesContext = createContext<SavedSchemesContextType | undefined>(
  undefined
);

// Helper to consistently extract the scheme ID from a SavedSchemeItem
function extractSchemeId(item: SavedSchemeItem): string {
  if (typeof item.schemeId === "string" && item.schemeId) {
    return item.schemeId;
  }
  if (item.schemeId && typeof (item.schemeId as any)._id === "string") {
    return (item.schemeId as any)._id;
  }
  if (item.scheme && typeof item.scheme._id === "string") {
    return item.scheme._id;
  }
  if (item.scheme && typeof (item.scheme as any).id === "string") {
    return (item.scheme as any).id;
  }
  return "";
}

function extractAllIds(items: SavedSchemeItem[]): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    const sId = extractSchemeId(item);
    if (sId) ids.add(String(sId));
  }
  return ids;
}

export function SavedSchemesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedSchemeItem[]>([]);
  const [savedSchemeIds, setSavedSchemeIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSaved = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedItems([]);
      setSavedSchemeIds(new Set());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const items = await getSavedSchemes();
      setSavedItems(items);
      setSavedSchemeIds(extractAllIds(items));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load saved schemes";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      setSavedItems([]);
      setSavedSchemeIds(new Set());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    getSavedSchemes()
      .then((items) => {
        if (!cancelled) {
          setSavedItems(items);
          setSavedSchemeIds(extractAllIds(items));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load saved schemes";
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const isSaved = useCallback(
    (schemeId: string) => {
      if (!schemeId) return false;
      return savedSchemeIds.has(String(schemeId));
    },
    [savedSchemeIds]
  );

  const save = useCallback(
    async (schemeId: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      const normId = String(schemeId);

      // Optimistic update
      setSavedSchemeIds((prev) => new Set(prev).add(normId));

      try {
        await apiSaveScheme(normId);
        // Refresh list in background to pull populated scheme details
        const updated = await getSavedSchemes();
        setSavedItems(updated);
        setSavedSchemeIds(extractAllIds(updated));
        return true;
      } catch (err) {
        // Rollback
        setSavedSchemeIds((prev) => {
          const next = new Set(prev);
          next.delete(normId);
          return next;
        });
        throw err;
      }
    },
    [isAuthenticated]
  );

  const unsave = useCallback(
    async (schemeId: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      const normId = String(schemeId);

      // Optimistic update
      const prevIds = new Set(savedSchemeIds);
      const prevItems = [...savedItems];

      setSavedSchemeIds((prev) => {
        const next = new Set(prev);
        next.delete(normId);
        return next;
      });
      setSavedItems((prev) =>
        prev.filter((item) => {
          const sId = extractSchemeId(item);
          return sId !== normId && item._id !== normId;
        })
      );

      try {
        await apiUnsaveScheme(normId);
        return true;
      } catch (err) {
        // Rollback on failure
        setSavedSchemeIds(prevIds);
        setSavedItems(prevItems);
        throw err;
      }
    },
    [isAuthenticated, savedSchemeIds, savedItems]
  );

  const toggleSave = useCallback(
    async (schemeId: string): Promise<boolean> => {
      if (savedSchemeIds.has(schemeId)) {
        return unsave(schemeId);
      } else {
        return save(schemeId);
      }
    },
    [savedSchemeIds, save, unsave]
  );

  const value = useMemo(
    () => ({
      savedItems,
      savedSchemeIds,
      savedCount: savedSchemeIds.size,
      isLoading,
      error,
      isSaved,
      toggleSave,
      save,
      unsave,
      refresh: fetchSaved,
    }),
    [savedItems, savedSchemeIds, isLoading, error, isSaved, toggleSave, save, unsave, fetchSaved]
  );

  return (
    <SavedSchemesContext.Provider value={value}>
      {children}
    </SavedSchemesContext.Provider>
  );
}

export function useSavedSchemes() {
  const context = useContext(SavedSchemesContext);
  if (!context) {
    throw new Error("useSavedSchemes must be used within a SavedSchemesProvider");
  }
  return context;
}
