import type { EntryCategory } from "./journal";

export interface CategoryCount {
  category: EntryCategory;
  count: number;
}

export interface ProjectCount {
  projectTag: string;
  count: number;
}

export interface TraitCount {
  traitTag: string;
  count: number;
}

export interface InsightsSummary {
  totalThisWeek: number;
  entriesByCategory: CategoryCount[];
  topProjects: ProjectCount[];
  topTraits: TraitCount[];
  mostFrequentCategory: EntryCategory | null;
  mostActiveProject: string | null;
  mostActiveTrait: string | null;
}

