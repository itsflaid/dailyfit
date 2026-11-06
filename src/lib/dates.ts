const DAY_MS = 86_400_000;

export function addDaysToKey(key: string, delta: number): string {
  return new Date(Date.parse(`${key}T00:00:00Z`) + delta * DAY_MS).toISOString().slice(0, 10);
}

export function keyToUtcDate(key: string): Date {
  return new Date(`${key}T00:00:00Z`);
}

export function keyToLocalDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
