"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Square, Timer } from "lucide-react";

const FALLBACK_AUDIO = {
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const storageKey = `${STORAGE_PREFIX}:${userKey ?? "guest"}`;

  const display = useMemo(() => formatTime(secondsLeft), [secondsLeft]);
  const inputValue = useMemo(() => toTimerInput(duration), [duration]);
  const isOvertime = secondsLeft < 0;
  const selectedAudioName = useMemo(
    () => audios.find((audio) => audio.src === audioSrc)?.name ?? "timer",
    [audioSrc, audios],
  );
  const primaryActionLabel = isRunning
    ? isOvertime
      ? "Stop"
      : "Pause"
    : secondsLeft < 0
      ? "Lanjut"
      : "Start";

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

  useEffect(() => {
    fetch("/api/timer-audios")
      .then((res) => res.json())
      .then((data: { audios?: TimerAudio[] }) => {
        const nextAudios =
          data.audios && data.audios.length > 0 ? data.audios : [FALLBACK_AUDIO];

        setAudios(nextAudios);
        setAudioSrc((current) =>
          nextAudios.some((audio) => audio.src === current)
            ? current
            : nextAudios[0]?.src ?? FALLBACK_AUDIO.src,
        );
      })
      .catch(() => {
        setAudios([FALLBACK_AUDIO]);
        setAudioSrc(FALLBACK_AUDIO.src);
      });
  }, []);

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

  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      setSecondsLeft(getSecondsLeft(deadline, secondsLeft));
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);

    return () => window.clearInterval(intervalId);
  }, [deadline, isRunning, secondsLeft]);

  useEffect(() => {
    if (!isRunning || hasAlarmed || secondsLeft > 0) return;

    setHasAlarmed(true);
    audioRef.current?.play().catch(() => undefined);
  }, [hasAlarmed, isRunning, secondsLeft]);

  const startTimer = () => {
    const nextDeadline = Date.now() + secondsLeft * 1000;

    setDeadline(nextDeadline);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setSecondsLeft(getSecondsLeft(deadline, secondsLeft));
    setDeadline(null);
    setIsRunning(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const resetTimer = () => {
    setSecondsLeft(duration);
    setDeadline(null);
    setIsRunning(false);
    setHasAlarmed(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleDurationChange = (value: string) => {
    const nextDuration = parseTimerInput(value);

    setDuration(nextDuration);
    setSecondsLeft(nextDuration);
    setDeadline(null);
    setIsRunning(false);
    setHasAlarmed(false);
  };

  const handleAudioChange = (nextAudioSrc: string) => {
    setAudioSrc(nextAudioSrc);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <section
      className={`min-h-[calc(100vh-7rem)] overflow-hidden rounded-[2rem] border p-5 transition-all duration-300 md:p-10 ${
        isOvertime
          ? "border-red-700 bg-red-600 text-white shadow-2xl shadow-red-600/30"
          : "border-gray-100 bg-white text-gray-950 shadow-sm"
      }`}
    >
      <audio ref={audioRef} src={audioSrc} preload="auto" />

      <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-3xl flex-col items-center justify-center text-center">
        <div
          className={`mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[2px] transition-colors ${
            isOvertime ? "bg-white/15 text-white" : "bg-red-50 text-red-600"
          }`}
        >
          <Timer className="h-4 w-4" />
          <span>{isOvertime ? "Waktu Habis" : "Workout Timer"}</span>
        </div>

        <p
          className={`mb-3 text-sm font-bold uppercase tracking-[2px] transition-colors ${
            isOvertime ? "text-white/75" : "text-gray-400"
          }`}
        >
          {isRunning ? "Sedang berjalan" : "Siap dipakai"}
        </p>

        <div
          className={`font-display text-[5rem] font-black leading-none tracking-tighter tabular-nums transition-colors sm:text-[8rem] md:text-[10rem] ${
            isOvertime ? "text-white drop-shadow-xl" : "text-gray-950"
          }`}
        >
          {display}
        </div>

        <p
          className={`mt-4 max-w-md text-sm leading-relaxed transition-colors ${
            isOvertime ? "text-white/90" : "text-gray-500"
          }`}
        >
          {isOvertime
            ? "Waktu sudah habis. Hitungan lanjut minus supaya overtime tetap kelihatan."
            : "Atur durasi, pilih audio, lalu mulai timer latihanmu."}
        </p>

        <div
          className={`mt-8 w-full max-w-xl rounded-[2rem] border p-4 text-left shadow-xl transition-colors md:p-5 ${
            isOvertime
              ? "border-white/20 bg-white/10 text-white shadow-red-950/20"
              : "border-gray-100 bg-white text-gray-900"
          }`}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label
              className={`block text-xs font-bold ${
                isOvertime ? "text-white/90" : "text-gray-500"
              }`}
            >
              Atur waktu
              <input
                type="time"
                step="1"
                value={inputValue}
                onChange={(event) => handleDurationChange(event.target.value)}
                className={`mt-1 w-full rounded-2xl border px-3 py-3 text-sm font-bold outline-none transition-colors ${
                  isOvertime
                    ? "border-white/20 bg-white text-gray-950 focus:border-white"
                    : "border-gray-200 bg-white text-gray-900 focus:border-red-500"
                }`}
              />
            </label>

            <label
              className={`block text-xs font-bold ${
                isOvertime ? "text-white/90" : "text-gray-500"
              }`}
            >
              Audio timer
              <select
                value={audioSrc}
                onChange={(event) => handleAudioChange(event.target.value)}
                className={`mt-1 w-full rounded-2xl border px-3 py-3 text-sm font-bold outline-none transition-colors ${
                  isOvertime
                    ? "border-white/20 bg-white text-gray-950 focus:border-white"
                    : "border-gray-200 bg-white text-gray-900 focus:border-red-500"
                }`}
              >
                {audios.map((audio) => (
                  <option key={audio.src} value={audio.src}>
                    {audio.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={isRunning ? pauseTimer : startTimer}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                isOvertime
                  ? "bg-white text-red-600 hover:bg-red-50"
                  : "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700"
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
              {primaryActionLabel}
            </button>

            <button
              type="button"
              onClick={resetTimer}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                isOvertime
                  ? "bg-red-800/40 text-white hover:bg-red-900/40"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          <p
            className={`mt-4 text-center text-[11px] leading-relaxed ${
              isOvertime ? "text-white/80" : "text-gray-400"
            }`}
          >
            Audio aktif: {selectedAudioName}.
          </p>
        </div>
      </div>
    </section>
  );
}
