import { useCallback, useEffect, useState } from "react";
import type { Trait } from "@/types";
import { api } from "@/lib/api";

interface TraitsState {
  traits: Trait[];
  loading: boolean;
  error: string | null;
}

export const useTraits = () => {
  const [state, setState] = useState<TraitsState>({
    traits: [],
    loading: false,
    error: null,
  });

  const loadTraits = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await api.listTraits();
      setState({ traits: result, loading: false, error: null });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load traits",
      }));
    }
  }, []);

  useEffect(() => {
    loadTraits();
  }, [loadTraits]);

  const createTrait = useCallback(
    async (name: string) => {
      const trait = await api.createTrait(name);
      await loadTraits();
      return trait;
    },
    [loadTraits],
  );

  const updateTrait = useCallback(
    async (id: number, name: string) => {
      const trait = await api.updateTrait(id, name);
      await loadTraits();
      return trait;
    },
    [loadTraits],
  );

  const deleteTrait = useCallback(
    async (id: number) => {
      await api.deleteTrait(id);
      await loadTraits();
    },
    [loadTraits],
  );

  return {
    ...state,
    refresh: loadTraits,
    createTrait,
    updateTrait,
    deleteTrait,
  };
};

