import { describe, expect, it } from "vitest";
import { addDaysToKey } from "@/lib/dates";
import { buildHeatmap, buildStats, resolveMonth, resolveToday, type DayRow } from "@/lib/stats";

const TODAY = "2026-11-15";

const day = (offset: number, done = 1, total = 1, category = "STRENGTH"): DayRow => ({
  day: addDaysToKey(TODAY, offset),
  category,
  total,
  done,
});

const stats = (rows: DayRow[]) => buildStats(rows, [], TODAY, "2026-11");

describe("streak", () => {
  it("tetap berlaku saat hari ini belum dicentang", () => {
    const result = stats([day(-2), day(-1), day(0, 0)]);
    expect(result.streak).toBe(2);
    expect(result.previousStreak).toBe(2);
  });

  it("bertambah setelah hari ini dicentang", () => {
    const result = stats([day(-2), day(-1), day(0)]);
    expect(result.streak).toBe(3);
    expect(result.previousStreak).toBe(2);
  });

  it("putus bila kemarin terlewat", () => {
    expect(stats([day(-3), day(-2)]).streak).toBe(0);
    expect(stats([day(-2), day(0)]).streak).toBe(1);
  });

  it("tidak menghitung hari yang hanya berisi latihan belum dicentang", () => {
    expect(stats([day(-1, 0, 3)]).streak).toBe(0);
  });
});

describe("ringkasan", () => {
  it("menjumlahkan tujuh hari terakhir", () => {
    const result = stats([day(-7, 5, 5), day(-6, 1, 2), day(0, 2, 4)]);
    expect(result.completedWeek).toBe(3);
    expect(result.totalWeek).toBe(6);
    expect(result.weeklyData).toHaveLength(7);
  });

  it("tidak mengisi kategori untuk hari yang belum tiba", () => {
    const { monthlyData } = stats([day(0)]);
    expect(monthlyData).toHaveLength(30);
    expect(monthlyData[14]).toMatchObject({ date: 15, STRENGTH: 1, CARDIO: 0 });
    expect(monthlyData[15]).toEqual({ date: 16 });
  });

  it("menggabungkan latihan yang pernah ganti kategori", () => {
    const result = buildStats(
      [],
      [
        { id: "a", name: "Push Up", category: "STRENGTH", count: 3 },
        { id: "a", name: "Push Up", category: "CARDIO", count: 2 },
        { id: "b", name: "Plank", category: "BALANCE", count: 4 },
      ],
      TODAY,
      "2026-11"
    );
    expect(result.allExercises).toEqual([
      { name: "Push Up", count: 5 },
      { name: "Plank", count: 4 },
    ]);
    expect(result.categoryData).toContainEqual({ name: "STRENGTH", value: 3 });
    expect(result.categoryData).toContainEqual({ name: "CARDIO", value: 2 });
  });
});

describe("parameter", () => {
  it("mengabaikan tanggal dan bulan yang tidak valid", () => {
    expect(resolveToday("2026-11-15")).toBe("2026-11-15");
    expect(resolveToday("besok")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(resolveMonth("2026-13", TODAY)).toBe("2026-11");
    expect(resolveMonth("2026-01", TODAY)).toBe("2026-01");
  });
});

describe("buildHeatmap", () => {
  it("menjumlahkan baris pada tanggal yang sama", () => {
    expect(buildHeatmap([{ day: TODAY, done: 2 }, { day: TODAY, done: 3 }])).toEqual({ [TODAY]: 5 });
  });
});
