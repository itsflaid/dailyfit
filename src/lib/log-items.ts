import type { Exercise } from "@prisma/client";

const SNAPSHOT_KEYS = [
  "name",
  "category",
  "type",
  "muscleGroup",
  "reps",
  "sets",
  "durationSeconds",
  "timeSets",
] as const;

export type ExerciseSnapshot = Pick<Exercise, (typeof SNAPSHOT_KEYS)[number]>;

export function takeSnapshot(exercise: ExerciseSnapshot): ExerciseSnapshot {
  return Object.fromEntries(
    SNAPSHOT_KEYS.map((key) => [key, exercise[key]])
  ) as ExerciseSnapshot;
}

// Baris tanpa snapshot (ditulis versi lama aplikasi) memakai data latihan saat ini.
export function applySnapshot<T extends { exercise: Exercise; snapshot: unknown }>(item: T) {
  const { snapshot, exercise, ...rest } = item;
  const saved = snapshot && typeof snapshot === "object" ? (snapshot as Partial<ExerciseSnapshot>) : {};
  return { ...rest, exercise: { ...exercise, ...saved } };
}
