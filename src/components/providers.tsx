"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useToday } from "@/lib/use-today";

function DayRollover() {
  const qc = useQueryClient();
  const today = useToday();
  const previous = useRef(today);

  useEffect(() => {
    if (previous.current === today) return;
    previous.current = today;
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["heatmap"] });
  }, [today, qc]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  }));

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <DayRollover />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
