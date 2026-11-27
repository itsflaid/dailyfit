import { describe, expect, it, vi } from "vitest";
import { isValidPassword } from "@/lib/password";
import { clientIp, tooManyRequests } from "@/lib/rate-limit";

vi.mock("@/lib/prisma", () => ({ default: {} }));

describe("isValidPassword", () => {
  it("meminta 8 sampai 72 byte", () => {
    expect(isValidPassword("1234567")).toBe(false);
    expect(isValidPassword("12345678")).toBe(true);
    expect(isValidPassword("a".repeat(72))).toBe(true);
    expect(isValidPassword("a".repeat(73))).toBe(false);
  });

  it("menghitung byte, bukan jumlah karakter", () => {
    expect(isValidPassword("é".repeat(37))).toBe(false);
  });
});

describe("rate limit", () => {
  const request = (headers: Record<string, string>) => new Request("http://test", { headers });

  it("mengambil alamat pertama dari x-forwarded-for", () => {
    expect(clientIp(request({ "x-forwarded-for": "1.1.1.1, 10.0.0.1" }))).toBe("1.1.1.1");
    expect(clientIp(request({ "x-real-ip": "2.2.2.2" }))).toBe("2.2.2.2");
    expect(clientIp(request({}))).toBe("unknown");
  });

  it("membalas 429 dengan Retry-After", async () => {
    const response = tooManyRequests(90);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("90");
    expect(await response.json()).toEqual({
      message: "Terlalu banyak percobaan. Coba lagi dalam 2 menit.",
    });
  });
});
