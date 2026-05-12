"use client";

import { Home, Dumbbell, CalendarCheck2, ListChecks, BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/exercises", label: "Exercise", icon: Dumbbell },
  { to: "/today", label: "Today", icon: CalendarCheck2 },
  { to: "/plans", label: "Plans", icon: ListChecks },
  { to: "/stats", label: "Stats", icon: BarChart3 },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  const activeIndex = NAV.findIndex((item) => isActive(item.to));

  return (
    <div className="md:hidden fixed bottom-6 inset-x-5 z-30">
      <nav
        style={{
          background: "#0f0a0b",
          borderRadius: "18px",
          border: "1px solid #1f1415",
        }}
      >
        <div className="grid grid-cols-5 relative px-1 py-1">
          <motion.div
            className="absolute top-1 bottom-1 rounded-2xl"
            style={{
              background: "#1a0a0a",
              border: "1px solid #3d1010",
              width: "calc(20% - 4px)",
              marginLeft: "2px",
            }}
            animate={{ left: `calc(${activeIndex * 20}%)` }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          />

          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);

            return (
              <Link
                key={item.to}
                href={item.to}
                className="flex flex-col items-center justify-center gap-1.5 py-3 relative z-10 active:opacity-60 transition-opacity duration-75"
              >
                <Icon
                  className="h-[20px] w-[20px]"
                  style={{
                    color: active ? "#dc2626" : "rgba(255,255,255,0.85)",
                    strokeWidth: 1.8,
                    transition: "color 0.15s",
                  }}
                />
                <span
                  className="text-[9px] font-bold tracking-wider uppercase"
                  style={{
                    color: active ? "#dc2626" : "rgba(255,255,255,0.85)",
                    transition: "color 0.15s",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          <motion.div
            className="absolute bottom-1 h-[2px] rounded-full"
            style={{
              background: "#dc2626",
              width: "calc(20% - 16px)",
              marginLeft: "8px",
            }}
            animate={{ left: `calc(${activeIndex * 20}%)` }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          />
        </div>
      </nav>
    </div>
  );
}