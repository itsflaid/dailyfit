export type ExerciseCategory = "STRENGTH" | "CARDIO" | "BALANCE" | "FLEXIBILITY";
export type ExerciseType = "REPS_BASED" | "TIME_BASED";
export type MuscleGroup =
  | "CHEST"
  | "BACK"
  | "SHOULDERS"
  | "BICEPS"
  | "TRICEPS"
  | "CORE"
  | "LEGS"
  | "FULL_BODY";

export interface Exercise {
  id: string;
  userId: string;
  name: string;
  category: ExerciseCategory;
  type: ExerciseType;
  muscleGroup: MuscleGroup;
  reps: number | null;
  sets: number | null;
  durationSeconds: number | null;
  timeSets: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  items?: PlanItem[];
}

export interface PlanItem {
  id: string;
  planId: string;
  exerciseId: string;
  order: number;
  exercise?: Exercise;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string;
  items: DailyLogItem[];
}

export interface DailyLogItem {
  id: string;
  dailyLogId: string;
  exerciseId: string;
  isChecked: boolean;
  order: number;
  source: string;
  exercise: Exercise;
}

export const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  STRENGTH: "Strength",
  CARDIO: "Cardio",
  BALANCE: "Balance",
  FLEXIBILITY: "Flexibility",
};

export const MUSCLE_GROUP_LABEL: Record<MuscleGroup, string> = {
  CHEST: "Chest",
  BACK: "Back",
  SHOULDERS: "Shoulders",
  BICEPS: "Biceps",
  TRICEPS: "Triceps",
  CORE: "Core",
  LEGS: "Legs",
  FULL_BODY: "Full Body",
};

export const CATEGORY_COLOR: Record<ExerciseCategory, string> = {
  STRENGTH: "bg-red-50 text-red-700 border-red-200",
  CARDIO: "bg-orange-50 text-orange-700 border-orange-200",
  BALANCE: "bg-blue-50 text-blue-700 border-blue-200",
  FLEXIBILITY: "bg-green-50 text-green-700 border-green-200",
};

export function exerciseDetail(ex: Exercise): string {
  if (ex.type === "REPS_BASED") {
    return `${ex.reps} reps × ${ex.sets} set`;
  }
  return `${ex.durationSeconds} detik × ${ex.timeSets} set`;
}
