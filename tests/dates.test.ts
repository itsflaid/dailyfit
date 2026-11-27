import { describe, expect, it } from "vitest";
import { addDaysToKey, isDateKey, keyToLocalDate } from "@/lib/dates";

describe("isDateKey", () => {
  it("menerima tanggal yang benar-benar ada", () => {
    expect(isDateKey("2026-11-28")).toBe(true);
    expect(isDateKey("2028-02-29")).toBe(true);
  });

  it("menolak format salah dan tanggal fiktif", () => {
    for (const value of ["2026-02-29", "2026-13-01", "2026-1-1", "", null, 20261128]) {
      expect(isDateKey(value)).toBe(false);
    }
  });
});

describe("addDaysToKey", () => {
  it("melewati batas bulan dan tahun", () => {
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToKey("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("keyToLocalDate", () => {
  it("mempertahankan tanggal kalender di zona waktu perangkat", () => {
    const date = keyToLocalDate("2026-11-28");
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 28]);
  });
});
