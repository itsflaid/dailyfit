import type { Exercise } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { applySnapshot, takeSnapshot } from "@/lib/log-items";

const exercise: Exercise = {
  id: "ex1",
  userId: "u1",
  name: "Push Up",
  category: "STRENGTH",
  type: "REPS_BASED",
  muscleGroup: "CHEST",
  reps: 10,
  sets: 3,
  durationSeconds: null,
  timeSets: null,
  deletedAt: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("snapshot riwayat", () => {
  it("mempertahankan data lama setelah latihan diubah", () => {
    const snapshot = takeSnapshot(exercise);
    const edited = { ...exercise, name: "Diamond Push Up", reps: 20 };

    const item = applySnapshot({ id: "i1", snapshot, exercise: edited });

    expect(item.exercise).toMatchObject({ id: "ex1", name: "Push Up", reps: 10 });
    expect(item).not.toHaveProperty("snapshot");
  });

  it("hanya menyimpan kolom yang ditampilkan di riwayat", () => {
    expect(takeSnapshot(exercise)).not.toHaveProperty("userId");
    expect(takeSnapshot(exercise)).not.toHaveProperty("deletedAt");
  });

  it("memakai data saat ini bila baris belum punya snapshot", () => {
    const item = applySnapshot({ id: "i1", snapshot: null, exercise });
    expect(item.exercise).toEqual(exercise);
  });
});
