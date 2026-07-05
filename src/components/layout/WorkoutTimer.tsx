"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Pause, Play, Plus, Pencil, RefreshCw, Square, Timer, Trash2 } from "lucide-react";
import { useTimerAudio } from "./TimerAudioProvider";

const FALLBACK_AUDIO: TimerAudio = {
  fileName: "timer.mp3",
  name: "timer",
  src: "/audio/timer.mp3",
};
const DEFAULT_SECONDS = 5 * 60;
const STORAGE_PREFIX = "dailyfit-workout-timer";

type TimerAudio = {
  fileName: string;
  name: string;
  src: string;
};

type StoredTimer = {
  duration: number;
  secondsLeft: number;
  isRunning: boolean;
  deadline: number | null;
  hasAlarmed: boolean;
  audioSrc?: string;
};

type TimerPreset = {
  id: string;
  name: string;
  duration: number;
};

const PRESET_STORAGE_PREFIX = "dailyfit-timer-presets";

type WorkoutTimerProps = {
  userKey?: string | null;
};

function clampDuration(value: number) {
  return Math.max(1, Math.min(value, 23 * 60 * 60 + 59 * 60 + 59));
}

function formatTime(totalSeconds: number) {
  const sign = totalSeconds < 0 ? "-" : "";
  const absolute = Math.abs(totalSeconds);
  const hours = Math.floor(absolute / 3600);
  const minutes = Math.floor((absolute % 3600) / 60);
  const seconds = absolute % 60;

  if (hours > 0) {
    return `${sign}${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${sign}${minutes}:${String(seconds).padStart(2, "0")}`;
}

function parseTimerInput(value: string) {
  const [hours = "0", minutes = "0", seconds = "0"] = value
    .split(":")
    .map((part) => part.trim());
  const totalSeconds =
    Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  if (!Number.isFinite(totalSeconds)) return DEFAULT_SECONDS;
  return clampDuration(totalSeconds);
}

function toTimerInput(totalSeconds: number) {
  const absolute = Math.max(0, totalSeconds);
  const hours = Math.floor(absolute / 3600);
  const minutes = Math.floor((absolute % 3600) / 60);
  const seconds = absolute % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getSecondsLeft(deadline: number | null, fallback: number) {
  if (!deadline) return fallback;
  return Math.ceil((deadline - Date.now()) / 1000);
}

export function WorkoutTimer({ userKey }: WorkoutTimerProps) {
  const [duration, setDuration] = useState(DEFAULT_SECONDS);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [hasAlarmed, setHasAlarmed] = useState(false);
  const [audios, setAudios] = useState<TimerAudio[]>([FALLBACK_AUDIO]);
  const [audioSrc, setAudioSrc] = useState(FALLBACK_AUDIO.src);
  const [presets, setPresets] = useState<TimerPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isPresetPanelOpen, setIsPresetPanelOpen] = useState(false);
  const [presetModal, setPresetModal] = useState<
    { mode: "add" } | { mode: "edit"; id: string } | null
  >(null);
  const [presetModalName, setPresetModalName] = useState("");
  const [presetModalDuration, setPresetModalDuration] = useState(DEFAULT_SECONDS);
  const storageKey = `${STORAGE_PREFIX}:${userKey ?? "guest"}`;
  const presetStorageKey = `${PRESET_STORAGE_PREFIX}:${userKey ?? "guest"}`;
  const selectedPreset = presets.find((p) => p.id === selectedPresetId) ?? null;
  const { triggerAlarm, stopAlarm, isAlarming } = useTimerAudio();

  const display = useMemo(() => formatTime(secondsLeft), [secondsLeft]);
  const inputValue = useMemo(() => toTimerInput(duration), [duration]);
  // Samain pemicu warna dengan pemicu alarm: keduanya pada secondsLeft <= 0
  // hasAlarmed sebagai guard supaya state awal durasi 0 tidak ikut overtime
  const isOvertime = secondsLeft <= 0 && hasAlarmed;

  const progressPct = Math.max(
    0,
    Math.min(100, (secondsLeft / duration) * 100)
  );

  const selectedAudioName = useMemo(
    () => audios.find((a) => a.src === audioSrc)?.name ?? "timer",
    [audioSrc, audios]
  );

  // ─── Restore from localStorage ───────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as StoredTimer;
      const nextSecondsLeft = parsed.isRunning
        ? getSecondsLeft(parsed.deadline, parsed.secondsLeft)
        : parsed.secondsLeft;
      setDuration(clampDuration(parsed.duration || DEFAULT_SECONDS));
      setSecondsLeft(nextSecondsLeft);
      setIsRunning(Boolean(parsed.isRunning));
      setDeadline(parsed.deadline);
      setHasAlarmed(Boolean(parsed.hasAlarmed || nextSecondsLeft <= 0));
      setAudioSrc(parsed.audioSrc || FALLBACK_AUDIO.src);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // ─── Fetch audio options ──────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/timer-audios")
      .then((res) => res.json())
      .then((data: { audios?: TimerAudio[] }) => {
        const next =
          data.audios && data.audios.length > 0 ? data.audios : [FALLBACK_AUDIO];
        setAudios(next);
        setAudioSrc((cur) =>
          next.some((a) => a.src === cur) ? cur : next[0]?.src ?? FALLBACK_AUDIO.src
        );
      })
      .catch(() => {
        setAudios([FALLBACK_AUDIO]);
        setAudioSrc(FALLBACK_AUDIO.src);
      });
  }, []);

  // ─── Persist to localStorage ─────────────────────────────────────────────
  useEffect(() => {
    const payload: StoredTimer = {
      duration,
      secondsLeft,
      isRunning,
      deadline,
      hasAlarmed,
      audioSrc,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [audioSrc, deadline, duration, hasAlarmed, isRunning, secondsLeft, storageKey]);

  // ─── Load presets ──────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(presetStorageKey);
      if (saved) setPresets(JSON.parse(saved));
    } catch {
      window.localStorage.removeItem(presetStorageKey);
    }
  }, [presetStorageKey]);

  // ─── Tick ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;
    const tick = () => setSecondsLeft(getSecondsLeft(deadline, secondsLeft));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadline, isRunning, secondsLeft]);

  // ─── Alarm — presisi ke deadline, bukan ikut ritme tick 1 detik ──────────
  useEffect(() => {
    if (!isRunning || hasAlarmed || deadline === null) return;
    const msLeft = deadline - Date.now();

    if (msLeft <= 0) {
      setHasAlarmed(true);
      return;
    }

    const id = window.setTimeout(() => {
      setHasAlarmed(true);
    }, msLeft);

    return () => window.clearTimeout(id);
  }, [deadline, hasAlarmed, isRunning]);

  // ─── Sync status alarm ke context secara instan ──────────────────────────
  useEffect(() => {
    if (isRunning && hasAlarmed) {
      triggerAlarm(audioSrc);
    } else if (isAlarming) {
      stopAlarm();
    }
  }, [isRunning, hasAlarmed, audioSrc, triggerAlarm, stopAlarm, isAlarming]);

  // ─── Presets ──────────────────────────────────────────────────────────────
  const openAddPresetModal = () => {
    setPresetModalName("");
    setPresetModalDuration(duration);
    setPresetModal({ mode: "add" });
    setIsPresetPanelOpen(false);
  };

  const openEditPresetModal = (preset: TimerPreset) => {
    setPresetModalName(preset.name);
    setPresetModalDuration(preset.duration);
    setPresetModal({ mode: "edit", id: preset.id });
    setIsPresetPanelOpen(false);
  };

  const closePresetModal = () => setPresetModal(null);

  const savePresetModal = () => {
    const name = presetModalName.trim();
    if (!name) return;

    if (presetModal?.mode === "edit") {
      const next = presets.map((p) =>
        p.id === presetModal.id ? { ...p, name, duration: presetModalDuration } : p
      );
      setPresets(next);
      window.localStorage.setItem(presetStorageKey, JSON.stringify(next));
    } else {
      const next: TimerPreset[] = [
        ...presets,
        { id: `${Date.now()}`, name, duration: presetModalDuration },
      ];
      setPresets(next);
      window.localStorage.setItem(presetStorageKey, JSON.stringify(next));
    }
    closePresetModal();
  };

  const applyPreset = (preset: TimerPreset) => {
    setDuration(preset.duration);
    setSecondsLeft(preset.duration);
    setDeadline(null);
    setIsRunning(false);
    setHasAlarmed(false);
    setSelectedPresetId(preset.id);
    setIsPresetPanelOpen(false);
  };

  const deletePreset = (id: string) => {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    window.localStorage.setItem(presetStorageKey, JSON.stringify(next));
    if (selectedPresetId === id) setSelectedPresetId(null);
  };

  // ─── Controls ────────────────────────────────────────────────────────────
  const startTimer = () => {
    setDeadline(Date.now() + secondsLeft * 1000);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setSecondsLeft(getSecondsLeft(deadline, secondsLeft));
    setDeadline(null);
    setIsRunning(false);
  };

  const resetTimer = () => {
    setSecondsLeft(duration);
    setDeadline(null);
    setIsRunning(false);
    setHasAlarmed(false);
  };

  const handleDurationChange = (value: string) => {
    const next = parseTimerInput(value);
    setDuration(next);
    setSecondsLeft(next);
    setDeadline(null);
    setIsRunning(false);
    setHasAlarmed(false);
    setSelectedPresetId(null);
  };

  const handleAudioChange = (src: string) => {
    setAudioSrc(src);
  };

  // ─── Conditional classes (NO transition on bg/text — instant switch) ──────
  //
  // Key fix: sebelumnya pakai `transition-all duration-300` yang bikin
  // background berubah pelan. Sekarang:
  //   - Root pakai `transition-[border-color,box-shadow]` — hanya border & shadow
  //     yang smooth, background & text langsung berubah.
  //   - Semua warna fg/bg pakai kondisi inline, bukan Tailwind transition.
  //

  const rootBase =
    "min-h-[calc(100vh-7rem)] overflow-hidden rounded-[1.75rem] border p-5 md:p-8 transition-[border-color,box-shadow] duration-200";
  const rootCls = isOvertime
    ? `${rootBase} border-red-700 bg-red-600 text-white shadow-2xl shadow-red-600/25`
    : `${rootBase} border-gray-100 bg-white text-gray-950 shadow-sm`;

  return (
    <section className={rootCls}>
      <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-2xl flex-col items-center justify-center gap-6 text-center">

        {/* ── Badge ── */}
        <div
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
            isOvertime
              ? "bg-white/15 text-white"
              : "bg-red-50 text-red-600"
          }`}
        >
          <Timer className="h-3.5 w-3.5" />
          <span>{isOvertime ? "Waktu Habis" : "Workout Timer"}</span>
          {/* Status dot */}
          <span
            className={`ml-1 h-1.5 w-1.5 rounded-full ${
              isRunning
                ? "bg-green-500"
                : isOvertime
                ? "bg-white/60"
                : "bg-gray-300"
            }`}
          />
        </div>

        {/* ── Time display ── */}
        <div
          className={`font-display text-[5.5rem] font-black leading-none tracking-[-4px] tabular-nums sm:text-[7.5rem] md:text-[9rem] ${
            isOvertime ? "text-white" : "text-gray-950"
          }`}
        >
          {display}
        </div>

        {/* ── Progress bar ── */}
        <div className="w-full max-w-xs">
          <div
            className={`h-[3px] w-full overflow-hidden rounded-full ${
              isOvertime ? "bg-white/20" : "bg-gray-100"
            }`}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
                isOvertime ? "bg-white" : "bg-red-500"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p
            className={`mt-2 text-xs ${
              isOvertime ? "text-white/60" : "text-gray-400"
            }`}
          >
            {isRunning ? "Sedang berjalan" : "Klik mulai"}
          </p>
        </div>

        {/* ── Controls card ── */}
        <div
          className={`w-full max-w-sm rounded-2xl border p-4 text-left ${
            isOvertime
              ? "border-white/20 bg-white/10"
              : "border-gray-100 bg-white shadow-md"
          }`}
        >
          {/* ── Preset trigger ── */}
          <div className="relative mb-3">
            <button
              type="button"
              onClick={() => setIsPresetPanelOpen((v) => !v)}
              className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                isOvertime
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-gray-200 bg-gray-50 text-gray-900"
              }`}
            >
              <span>{selectedPreset ? `Preset: ${selectedPreset.name}` : "Preset"}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isPresetPanelOpen ? "rotate-180" : ""}`} />
            </button>

            {isPresetPanelOpen && (
              <div
                className={`absolute z-20 mt-1.5 w-full rounded-xl border shadow-lg overflow-hidden ${
                  isOvertime ? "border-white/20 bg-gray-900" : "border-gray-200 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={openAddPresetModal}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-left border-b ${
                    isOvertime
                      ? "border-white/10 text-white hover:bg-white/10"
                      : "border-gray-100 text-red-600 hover:bg-red-50"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Tambah Preset
                </button>

                {presets.length === 0 ? (
                  <div className={`px-3 py-3 text-xs ${isOvertime ? "text-white/50" : "text-gray-400"}`}>
                    Belum ada preset tersimpan.
                  </div>
                ) : (
                  presets.map((p) => (
                    <div
                      key={p.id}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer ${
                        isOvertime ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-gray-50"
                      }`}
                      onClick={() => applyPreset(p)}
                    >
                      <span className="font-medium">
                        {p.name} <span className="opacity-60 font-normal">· {formatTime(p.duration)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditPresetModal(p);
                          }}
                          aria-label={`Edit preset ${p.name}`}
                          className={`h-7 w-7 rounded-full flex items-center justify-center ${
                            isOvertime ? "hover:bg-white/20" : "hover:bg-gray-200"
                          }`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePreset(p.id);
                          }}
                          aria-label={`Hapus preset ${p.name}`}
                          className={`h-7 w-7 rounded-full flex items-center justify-center ${
                            isOvertime ? "hover:bg-white/20" : "hover:bg-gray-200"
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Duration input */}
            <label
              className={`block text-[10px] font-bold uppercase tracking-widest ${
                isOvertime ? "text-white/70" : "text-gray-400"
              }`}
            >
              Durasi
              <input
                type="time"
                step="1"
                value={inputValue}
                onChange={(e) => handleDurationChange(e.target.value)}
                className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition-colors ${
                  isOvertime
                    ? "border-white/20 bg-white text-gray-950 focus:border-white"
                    : "border-gray-200 bg-gray-50 text-gray-900 focus:border-red-400"
                }`}
              />
            </label>

            {/* Audio select */}
            <label
              className={`block text-[10px] font-bold uppercase tracking-widest ${
                isOvertime ? "text-white/70" : "text-gray-400"
              }`}
            >
              Audio
              <select
                value={audioSrc}
                onChange={(e) => handleAudioChange(e.target.value)}
                className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition-colors ${
                  isOvertime
                    ? "border-white/20 bg-white text-gray-950 focus:border-white"
                    : "border-gray-200 bg-gray-50 text-gray-900 focus:border-red-400"
                }`}
              >
                {audios.map((a) => (
                  <option key={a.src} value={a.src}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Buttons */}
          <div className="mt-3 flex gap-2.5">
            <button
              type="button"
              onClick={isRunning ? pauseTimer : startTimer}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                isOvertime
                  ? "bg-white text-red-600 hover:bg-red-50 active:bg-red-100"
                  : "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
              }`}
            >
              {isRunning ? (
                isOvertime ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning
                ? isOvertime
                  ? "Stop"
                  : "Pause"
                : secondsLeft < 0
                ? "Lanjut"
                : "Mulai"}
            </button>

            <button
              type="button"
              onClick={resetTimer}
              aria-label="Reset timer"
              className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border transition-colors ${
                isOvertime
                  ? "border-white/25 bg-white/15 text-white hover:bg-white/25"
                  : "border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

      
        </div>
      </div>

      {presetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closePresetModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              {presetModal.mode === "edit" ? "Edit Preset" : "Tambah Preset"}
            </h2>

            <label className="block text-xs font-semibold text-gray-500">
              Nama Preset
              <input
                type="text"
                value={presetModalName}
                onChange={(e) => setPresetModalName(e.target.value)}
                placeholder="misal: Sprint 30 detik"
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-red-400"
              />
            </label>

            <label className="block text-xs font-semibold text-gray-500">
              Durasi
              <input
                type="time"
                step="1"
                value={toTimerInput(presetModalDuration)}
                onChange={(e) => setPresetModalDuration(parseTimerInput(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-red-400"
              />
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={closePresetModal}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-slate-600 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={savePresetModal}
                disabled={!presetModalName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-40"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}