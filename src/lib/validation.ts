import { ExerciseCategory, ExerciseType, MuscleGroup } from "@prisma/client";

const MAX_NAME = 100;
const MAX_COUNT = 10_000;
const MAX_DURATION = 86_400;

const isOneOf = <T extends string>(options: Record<string, T>, value: unknown): value is T =>
  Object.values(options).includes(value as T);

const isCount = (value: unknown, max: number): value is number =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= max;

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  const body = await req.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body) ? body : null;
}

export function cleanText(value: unknown, max = MAX_NAME): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 && text.length <= max ? text : null;
}

export function parseExercise(body: Record<string, unknown>) {
  const name = cleanText(body.name);
  const { category, type, muscleGroup, reps, sets, durationSeconds, timeSets } = body;
  if (
    !name ||
    !isOneOf(ExerciseCategory, category) ||
    !isOneOf(ExerciseType, type) ||
    !isOneOf(MuscleGroup, muscleGroup)
  ) {
    return null;
  }

  const base = { name, category, type, muscleGroup };

  if (type === ExerciseType.REPS_BASED) {
    if (!isCount(reps, MAX_COUNT) || !isCount(sets, MAX_COUNT)) return null;
    return { ...base, reps, sets, durationSeconds: null, timeSets: null };
  }

  if (!isCount(durationSeconds, MAX_DURATION) || !isCount(timeSets, MAX_COUNT)) return null;
  return { ...base, reps: null, sets: null, durationSeconds, timeSets };
}

export function uniqueIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((v): v is string => typeof v === "string"))];
}
