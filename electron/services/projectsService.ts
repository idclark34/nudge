import { getDatabase } from "../database";
import type { Project } from "../../src/types/taxonomy";

const mapProject = (row: {
  id: number;
  name: string;
  created_at: string;
}): Project => ({
  id: Number(row.id),
  name: row.name,
  createdAt: row.created_at,
});

export const listProjects = (): Project[] => {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
      SELECT id, name, created_at
      FROM projects
      ORDER BY name ASC;
    `,
    )
    .all() as Array<{ id: number; name: string; created_at: string }>;

  return rows.map(mapProject);
};

export const createProject = (name: string): Project => {
  const db = getDatabase();
  const result = db
    .prepare(
      `
      INSERT INTO projects (name)
      VALUES (?) ON CONFLICT(name) DO UPDATE SET name = excluded.name
      RETURNING id, name, created_at;
    `,
    )
    .get(name) as { id: number; name: string; created_at: string };

  return mapProject(result);
};

export const updateProject = (id: number, name: string): Project => {
  const db = getDatabase();
  db.prepare("UPDATE projects SET name = ? WHERE id = ?;").run(name, id);

  const row = db
    .prepare(
      `
      SELECT id, name, created_at
      FROM projects
      WHERE id = ?;
    `,
    )
    .get(id) as { id: number; name: string; created_at: string } | undefined;

  if (!row) {
    throw new Error(`Project ${id} not found`);
  }

  return mapProject(row);
};

export const deleteProject = (id: number): void => {
  const db = getDatabase();
  db.prepare("DELETE FROM projects WHERE id = ?;").run(id);
};

