"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Flame, CalendarCheck2, Dumbbell, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getGreeting } from "@/lib/utils";

export default function HomePage() {
  const { data: session } = useSession();
  const name = session?.user?.name

  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => fetch("/api/stats").then((r) => r.json()),
  });

  const progress = stats?.totalWeek > 0
    ? Math.round((stats.completedWeek / stats.totalWeek) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="crimson-gradient rounded-2xl p-6 text-white shadow-lg">
        <div className="text-sm text-red-200 mb-1">{getGreeting()},</div>
        <h1 className="text-3xl font-black tracking-tight mb-1">
          {name}
        </h1>
        <p className="text-red-100 text-sm mb-4">
          Tetap konsisten. Setiap repetisi adalah investasi untuk diri Anda.
        </p>
        {isLoading ? (
          <div className="inline-block h-7 w-32 rounded-full bg-white/15 animate-pulse" />
        ) : (
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium">
            <Flame className="h-4 w-4" />
            Streak {stats.streak ?? 0} hari
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border p-4 space-y-3 shadow-sm">
            <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
            <div className="h-8 w-24 rounded bg-slate-100 animate-pulse" />
            <div className="h-1.5 w-full rounded-full bg-slate-100 animate-pulse" />
          </div>
          <div className="bg-white rounded-2xl border p-4 space-y-3 shadow-sm">
            <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
            <div className="h-8 w-16 rounded bg-slate-100 animate-pulse" />
            <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border p-4 space-y-2 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <TrendingUp className="h-3.5 w-3.5 text-primary-600" />
              Minggu Ini
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900">{stats.completedWeek ?? 0}</span>
              <span className="text-sm text-muted-foreground">/ {stats.totalWeek ?? 0} selesai</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border p-4 space-y-2 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Flame className="h-3.5 w-3.5 text-primary-600" />
              Streak Saat Ini
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900">{stats.streak ?? 0}</span>
              <span className="text-sm text-muted-foreground">hari berturut</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Centang minimal satu latihan setiap hari untuk menjaga streak.
            </p>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/today"
          className="bg-white rounded-2xl border p-4 flex items-center gap-3 hover:shadow-md transition group shadow-sm"
        >
          <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition">
            <CalendarCheck2 className="h-5 w-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900 text-sm">Checklist Hari Ini</div>
            <div className="text-xs text-muted-foreground">Lihat & centang latihan harian</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary-600 transition flex-shrink-0" />
        </Link>

        <Link
          href="/exercises"
          className="bg-white rounded-2xl border p-4 flex items-center gap-3 hover:shadow-md transition group shadow-sm"
        >
          <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition">
            <Dumbbell className="h-5 w-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900 text-sm">Pustaka Latihan</div>
            <div className="text-xs text-muted-foreground">Kelola koleksi latihan Anda</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary-600 transition flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
}
