import { describe, expect, it } from "vitest";
import { cleanText, parseExercise, readJson, uniqueIds } from "@/lib/validation";

const reps = {
  name: "  Push Up  ",
  category: "STRENGTH",
  type: "REPS_BASED",
  muscleGroup: "CHEST",
  reps: 12,
  sets: 3,
};

describe("parseExercise", () => {
  it("merapikan nama dan mengosongkan kolom waktu untuk latihan repetisi", () => {
    expect(parseExercise({ ...reps, durationSeconds: 60 })).toMatchObject({
      name: "Push Up",
      reps: 12,
      sets: 3,
      durationSeconds: null,
      timeSets: null,
    });
  });

  it("mengosongkan repetisi untuk latihan berbasis waktu", () => {
    expect(
      parseExercise({ ...reps, type: "TIME_BASED", durationSeconds: 45, timeSets: 2 })
    ).toMatchObject({ reps: null, sets: null, durationSeconds: 45, timeSets: 2 });
  });

  it.each([
    ["nama kosong", { name: " " }],
    ["kategori asing", { category: "YOGA" }],
    ["reps nol", { reps: 0 }],
    ["reps pecahan", { reps: 1.5 }],
    ["set berupa teks", { sets: "3" }],
  ])("menolak %s", (_, patch) => {
    expect(parseExercise({ ...reps, ...patch })).toBeNull();
  });
});

describe("helper input", () => {
  it("membatasi panjang teks", () => {
    expect(cleanText("a".repeat(101))).toBeNull();
    expect(cleanText(123)).toBeNull();
  });

  it("membuang id ganda dan bukan string", () => {
    expect(uniqueIds(["a", "a", 1, "b"])).toEqual(["a", "b"]);
    expect(uniqueIds("a")).toEqual([]);
  });

  it("hanya menerima body JSON berbentuk objek", async () => {
    const request = (body: string) => new Request("http://test", { method: "POST", body });
    expect(await readJson(request('{"a":1}'))).toEqual({ a: 1 });
    expect(await readJson(request("[1]"))).toBeNull();
    expect(await readJson(request("rusak"))).toBeNull();
  });
});
