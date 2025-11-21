import { useCallback, useEffect, useState } from "react";
import type { Project } from "@/types";
import { api } from "@/lib/api";

interface ProjectsState {
  projects: Project[];
  loading: boolean;
  error: string | null;
}

export const useProjects = () => {
  const [state, setState] = useState<ProjectsState>({
    projects: [],
    loading: false,
    error: null,
  });

  const loadProjects = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await api.listProjects();
      setState({ projects: result, loading: false, error: null });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load projects",
      }));
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = useCallback(
    async (name: string) => {
      const project = await api.createProject(name);
      await loadProjects();
      return project;
    },
    [loadProjects],
  );

  const updateProject = useCallback(
    async (id: number, name: string) => {
      const project = await api.updateProject(id, name);
      await loadProjects();
      return project;
    },
    [loadProjects],
  );

  const deleteProject = useCallback(
    async (id: number) => {
      await api.deleteProject(id);
      await loadProjects();
    },
    [loadProjects],
  );

  return {
    ...state,
    refresh: loadProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};

