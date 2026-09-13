"use client";

import { useEffect, useState } from "react";
import { Home, Dumbbell, CalendarCheck2, ListChecks, BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/exercises", label: "Exercise", icon: Dumbbell },
  { to: "/today", label: "Today", icon: CalendarCheck2 },
  { to: "/plans", label: "Plans", icon: ListChecks },
  { to: "/stats", label: "Stats", icon: BarChart3 },
] as const;

const TODAY_INDEX = 2;

// Tinggi konten bar (belum termasuk safe-area di bawahnya).
// Nilai ini harus sama dengan padding-bottom yang dicadangkan <main> di AppShell.
const BAR_HEIGHT = 64;

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  const activeIndex = NAV.findIndex((item) => isActive(item.to));
  const isTodayActive = activeIndex === TODAY_INDEX;

  // Posisi horizontal garis "dibekukan" di sini selama Today aktif, supaya:
  // - pindah KE Today: garis turun lurus dari posisi terakhirnya (tanpa geser dulu)
  // - pindah DARI Today: posisi X sudah pindah diam-diam selagi tersembunyi,
  //   jadi begitu muncul lagi dia naik lurus persis di tab yang baru.
  const [linePos, setLinePos] = useState(
    activeIndex >= 0 && !isTodayActive ? activeIndex : 0
  );

  useEffect(() => {
    if (activeIndex >= 0 && !isTodayActive) {
      setLinePos(activeIndex);
    }
  }, [activeIndex, isTodayActive]);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30"
      style={{
        background: "#0f0a0b",
        borderTop: "1px solid #1f1415",
        // Ganjal tambahan buat home-indicator / gesture bar di iOS & Android
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="grid grid-cols-5 relative px-1 overflow-hidden"
        style={{ height: BAR_HEIGHT }}
      >
        {NAV.map((item, index) => {
          if (index === TODAY_INDEX) {
            // Kolom tetap dijaga lebarnya biar perhitungan posisi garis (20% per
            // kolom) tidak berubah, tapi tombolnya sendiri dirender di luar grid
            // supaya bisa melayang (lihat <Link> FAB di bawah).
            return <div key={item.to} aria-hidden className="invisible" />;
          }

          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <Link
              key={item.to}
              href={item.to}
              className="flex flex-col items-center justify-center gap-1.5 relative z-10 active:opacity-60 transition-opacity duration-75"
            >
              <Icon
                className="h-[20px] w-[20px]"
                style={{
                  color: active ? "#ffffff" : "rgba(255,255,255,0.4)",
                  strokeWidth: 1.8,
                  transition: "color 0.15s",
                }}
              />
              <span
                className="text-[9px] font-bold tracking-wider uppercase"
                style={{
                  color: active ? "#ffffff" : "rgba(255,255,255,0.4)",
                  transition: "color 0.15s",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        <AnimatePresence initial={false}>
          {!isTodayActive && (
            <motion.div
              key="active-underline"
              className="absolute h-[2px] rounded-full"
              style={{
                background: "#dc2626",
                width: "calc(20% - 16px)",
                marginLeft: "8px",
              }}
              initial={{ left: `calc(${linePos * 20}%)`, bottom: -18, opacity: 0 }}
              animate={{ left: `calc(${linePos * 20}%)`, bottom: 4, opacity: 1 }}
              exit={{ bottom: -18, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Tombol Today mengambang */}
      <Link
        href="/today"
        aria-label="Today"
        className="absolute left-1/2 flex items-center justify-center active:scale-95 transition-transform"
        style={{
          top: -22,
          transform: "translateX(-50%)",
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "linear-gradient(155deg, #dc2626, #C41230)",
          boxShadow: "0 6px 14px rgba(196,18,48,0.45)",
        }}
      >
        <CalendarCheck2
          className="h-[22px] w-[22px]"
          style={{ color: "#ffffff", strokeWidth: 1.8 }}
        />
      </Link>
    </nav>
  );
}