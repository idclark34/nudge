import { getDatabase } from "../database";
import type { Trait } from "../../src/types/taxonomy";

const mapTrait = (row: {
  id: number;
  name: string;
  created_at: string;
}): Trait => ({
  id: Number(row.id),
  name: row.name,
  createdAt: row.created_at,
});

export const listTraits = (): Trait[] => {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
      SELECT id, name, created_at
      FROM traits
      ORDER BY name ASC;
    `,
    )
    .all() as Array<{ id: number; name: string; created_at: string }>;

  return rows.map(mapTrait);
};

export const createTrait = (name: string): Trait => {
  const db = getDatabase();
  const row = db
    .prepare(
      `
      INSERT INTO traits (name)
      VALUES (?) ON CONFLICT(name) DO UPDATE SET name = excluded.name
      RETURNING id, name, created_at;
    `,
    )
    .get(name) as { id: number; name: string; created_at: string };

  return mapTrait(row);
};

export const updateTrait = (id: number, name: string): Trait => {
  const db = getDatabase();
  db.prepare("UPDATE traits SET name = ? WHERE id = ?;").run(name, id);

  const row = db
    .prepare(
      `
      SELECT id, name, created_at
      FROM traits
      WHERE id = ?;
    `,
    )
    .get(id) as { id: number; name: string; created_at: string } | undefined;

  if (!row) {
    throw new Error(`Trait ${id} not found`);
  }

  return mapTrait(row);
};

export const deleteTrait = (id: number): void => {
  const db = getDatabase();
  db.prepare("DELETE FROM traits WHERE id = ?;").run(id);
};

