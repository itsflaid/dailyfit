"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion, type PanInfo, type Variants } from "framer-motion";
import { CalendarDays, Check, ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import { addDaysToKey, keyToLocalDate } from "@/lib/dates";
import { dailyLogQuery, heatmapQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { CATEGORY_COLOR, CATEGORY_LABEL, exerciseDetail, type DailyLogItem } from "@/types";

const MAX_DAYS_BACK = 370;
const STRIP_LENGTH = 7;
const SWIPE_DISTANCE = 56;
const SWIPE_FLICK_DISTANCE = 24;
const SWIPE_FLICK_VELOCITY = 500;
const SLIDE_OFFSET = 28;
const WEEKDAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

interface Props {
  date: string;
  today: string;
  onDateChange: (date: string) => void;
}

function swipeIntent(info: PanInfo): -1 | 0 | 1 {
  const offset = info.offset.x;
  const velocity = info.velocity.x;
  const far = Math.abs(offset) > SWIPE_DISTANCE;
  const flick = Math.abs(velocity) > SWIPE_FLICK_VELOCITY && Math.abs(offset) > SWIPE_FLICK_DISTANCE;
  if (!far && !flick) return 0;
  return offset > 0 ? -1 : 1;
}

function stripDays(selected: string, today: string): string[] {
  const latest = addDaysToKey(selected, 3);
  const end = latest < today ? latest : today;
  return Array.from({ length: STRIP_LENGTH }, (_, i) => addDaysToKey(end, i - (STRIP_LENGTH - 1)));
}

function dayLabels(key: string, today: string): { title: string; subtitle: string } {
  const d = keyToLocalDate(key);
  const dateText = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const weekday = d.toLocaleDateString("id-ID", { weekday: "long" });
  if (key === today) return { title: "Hari ini", subtitle: `${weekday}, ${dateText}` };
  if (key === addDaysToKey(today, -1)) return { title: "Kemarin", subtitle: `${weekday}, ${dateText}` };
  return { title: weekday, subtitle: dateText };
}

function LogRow({ item }: { item: DailyLogItem }) {
  const ex = item.exercise;

  return (
    <li className="flex items-center gap-3 py-2.5" style={{ opacity: item.isChecked ? 1 : 0.5 }}>
      <span
        className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={
          item.isChecked
            ? { background: "#C41230" }
            : { background: "transparent", border: "1.5px solid rgba(0,0,0,0.15)" }
        }
      >
        {item.isChecked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: "#0F0A0B" }}>{ex.name}</div>
        <div className="text-xs mt-0.5" style={{ color: "#888" }}>{exerciseDetail(ex)}</div>
      </div>
      <span
        className={cn(
          "text-[10px] font-semibold px-2 py-0.5 rounded-md border flex-shrink-0",
          CATEGORY_COLOR[ex.category]
        )}
      >
        {CATEGORY_LABEL[ex.category]}
      </span>
    </li>
  );
}

function DayPanel({ date, today }: { date: string; today: string }) {
  const { data, isLoading, isError, refetch } = useQuery(dailyLogQuery(date));
  const { title, subtitle } = dayLabels(date, today);

  const items = useMemo(
    () => [...(data?.items ?? [])].sort((a, b) => a.order - b.order),
    [data]
  );
  const done = items.filter((i) => i.isChecked);
  const skipped = items.filter((i) => !i.isChecked);

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-2xl leading-none capitalize" style={{ color: "#0F0A0B" }}>
            {title}
          </h3>
          <p className="text-xs mt-1" style={{ color: "#888" }}>{subtitle}</p>
        </div>
        {items.length > 0 && (
          <div className="flex-shrink-0 text-right">
            <span className="font-display text-2xl" style={{ color: "#C41230" }}>{done.length}</span>
            <span className="text-xs" style={{ color: "#aaa" }}> / {items.length} selesai</span>
          </div>
        )}
      </div>

      <div className="mt-3 min-h-[7rem]">
        {isLoading ? (
          <div className="space-y-3 pt-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: "rgba(0,0,0,0.05)" }} />
            ))}
          </div>
        ) : isError ? (
          <div className="py-6 text-center">
            <p className="text-sm" style={{ color: "#888" }}>Gagal memuat log.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-sm font-semibold"
              style={{ color: "#C41230" }}
            >
              Coba lagi
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm" style={{ color: "#888" }}>
              {date === today ? "Belum ada gerakan hari ini." : "Tidak ada gerakan di hari ini."}
            </p>
          </div>
        ) : (
          <>
            {done.length > 0 && (
              <ul className="divide-y divide-black/5">
                {done.map((item) => (
                  <LogRow key={item.id} item={item} />
                ))}
              </ul>
            )}
            {skipped.length > 0 && (
              <>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mt-3 mb-1"
                  style={{ color: "#aaa" }}
                >
                  {date === today ? "Belum selesai" : "Tidak selesai"}
                </p>
                <ul className="divide-y divide-black/5">
                  {skipped.map((item) => (
                    <LogRow key={item.id} item={item} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function LogGerakan({ date, today, onDateChange }: Props) {
  const qc = useQueryClient();
  const reduceMotion = useReducedMotion();
  const { data: heatmap } = useQuery(heatmapQuery);

  const [shownDate, setShownDate] = useState(date);
  const [direction, setDirection] = useState<1 | -1>(1);
  if (shownDate !== date) {
    setShownDate(date);
    setDirection(date > shownDate ? 1 : -1);
  }

  const canPrev = date > addDaysToKey(today, -MAX_DAYS_BACK);
  const canNext = date < today;

  const dateInputRef = useRef<HTMLInputElement>(null);

  const go = (delta: -1 | 1) => {
    if (delta < 0 ? !canPrev : !canNext) return;
    onDateChange(addDaysToKey(date, delta));
  };

  const pickDate = (key: string) => {
    if (!key || key > today || key < addDaysToKey(today, -MAX_DAYS_BACK)) return;
    onDateChange(key);
  };

  useEffect(() => {
    qc.prefetchQuery(dailyLogQuery(addDaysToKey(date, -1)));
    if (date < today) qc.prefetchQuery(dailyLogQuery(addDaysToKey(date, 1)));
  }, [qc, date, today]);

  const offset = reduceMotion ? 0 : SLIDE_OFFSET;
  const slide: Variants = {
    enter: (d: number) => ({ opacity: 0, x: d * offset }),
    center: { opacity: 1, x: 0 },
  };

  const days = stripDays(date, today);

  return (
    <section
      id="log-gerakan"
      className="scroll-mt-24 bg-white rounded-2xl p-4 md:p-5"
      style={{ border: "1.5px solid rgba(0,0,0,0.07)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(196,18,48,0.08)" }}
          >
            <ListChecks className="h-3.5 w-3.5" style={{ color: "#C41230" }} />
          </div>
          <h2 className="font-display text-xl" style={{ color: "#0F0A0B" }}>Log Gerakan</h2>
        </div>

        <div className="flex items-center gap-1.5">
          {date !== today && (
            <button
              type="button"
              onClick={() => onDateChange(today)}
              className="h-8 px-2.5 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(196,18,48,0.08)", color: "#C41230" }}
            >
              Hari ini
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const input = dateInputRef.current;
              if (!input) return;
              try {
                input.showPicker();
              } catch {
                input.click();
              }
            }}
            aria-label="Pilih tanggal"
            className="h-8 w-8 rounded-xl flex items-center justify-center transition"
            style={{ background: "rgba(0,0,0,0.05)" }}
          >
            <CalendarDays className="h-4 w-4" style={{ color: "#555" }} />
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            min={addDaysToKey(today, -MAX_DAYS_BACK)}
            max={today}
            onChange={(e) => pickDate(e.target.value)}
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={!canPrev}
            aria-label="Hari sebelumnya"
            className="h-8 w-8 rounded-xl flex items-center justify-center transition disabled:opacity-30"
            style={{ background: "rgba(0,0,0,0.05)" }}
          >
            <ChevronLeft className="h-4 w-4" style={{ color: "#555" }} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={!canNext}
            aria-label="Hari berikutnya"
            className="h-8 w-8 rounded-xl flex items-center justify-center transition disabled:opacity-30"
            style={{ background: "rgba(0,0,0,0.05)" }}
          >
            <ChevronRight className="h-4 w-4" style={{ color: "#555" }} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mt-4">
        {days.map((key) => {
          const d = keyToLocalDate(key);
          const selected = key === date;
          const hasActivity = (heatmap?.[key] ?? 0) > 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDateChange(key)}
              aria-pressed={selected}
              aria-label={d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
              className="flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition"
              style={{
                background: selected ? "#C41230" : "rgba(0,0,0,0.04)",
                color: selected ? "#fff" : "#555",
                border: key === today && !selected ? "1.5px solid #C41230" : "1.5px solid transparent",
              }}
            >
              <span className="text-[10px] font-medium uppercase">{WEEKDAY_SHORT[d.getDay()]}</span>
              <span className="text-sm font-bold leading-none">{d.getDate()}</span>
              <span
                className="text-[9px] font-medium uppercase leading-none"
                style={{ opacity: selected ? 0.85 : 0.6 }}
              >
                {MONTH_SHORT[d.getMonth()]}
              </span>
              <span
                className="h-1 w-1 rounded-full"
                style={{ background: hasActivity ? (selected ? "#fff" : "#C41230") : "transparent" }}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden">
        <motion.div
          key={date}
          custom={direction}
          variants={slide}
          initial="enter"
          animate="center"
          transition={{ duration: 0.16, ease: "easeOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_, info) => {
            const intent = swipeIntent(info);
            if (intent !== 0) go(intent);
          }}
        >
          <DayPanel date={date} today={today} />
        </motion.div>
      </div>
    </section>
  );
}
