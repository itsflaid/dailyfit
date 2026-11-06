import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { getTodayDate } from "@/lib/utils";
import type { StatsData } from "@/types";

export const PROGRESS_MUTATION_KEY = ["daily-progress"];

const FIVE_MIN = 5 * 60_000;

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json() as Promise<T>;
}

export function waitForProgressMutations(qc: QueryClient): Promise<void> {
  const pending = () => qc.isMutating({ mutationKey: PROGRESS_MUTATION_KEY });
  if (pending() === 0) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = qc.getMutationCache().subscribe(() => {
      if (pending() === 0) {
        unsubscribe();
        resolve();
      }
    });
  });
}

export const statsQuery = (month: string) =>
  queryOptions({
    queryKey: ["stats", month],
    queryFn: async ({ client }) => {
      await waitForProgressMutations(client);
      return fetchJson<StatsData>(`/api/stats?month=${month}&today=${getTodayDate()}`, {
        cache: "no-store",
      });
    },
    staleTime: FIVE_MIN,
  });

export const heatmapQuery = queryOptions({
  queryKey: ["heatmap"],
  queryFn: async ({ client }) => {
    await waitForProgressMutations(client);
    return fetchJson<Record<string, number>>(`/api/stats/heatmap?today=${getTodayDate()}`);
  },
  staleTime: FIVE_MIN,
});
