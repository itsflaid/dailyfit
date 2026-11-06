"use client";

import { useEffect, useState } from "react";
import { getTodayDate } from "@/lib/utils";

export function useToday(): string {
  const [today, setToday] = useState(getTodayDate);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const sync = () => setToday(getTodayDate());

    const armMidnight = () => {
      clearTimeout(timer);
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(() => {
        sync();
        armMidnight();
      }, midnight.getTime() - now.getTime() + 100);
    };

    const resync = () => {
      if (document.visibilityState !== "visible") return;
      sync();
      armMidnight();
    };

    armMidnight();
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("focus", resync);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("focus", resync);
    };
  }, []);

  return today;
}
