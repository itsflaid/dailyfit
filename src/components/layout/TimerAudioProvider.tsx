"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Bell, X } from "lucide-react";

const FALLBACK_AUDIO: TimerAudio = { fileName: "timer.mp3", name: "timer", src: "/audio/timer.mp3" };
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

type TimerAudioContextType = {
  stopAlarm: () => void;
  triggerAlarm: (audioSrc: string) => void;
  isAlarming: boolean;
};

const TimerAudioContext = createContext<TimerAudioContextType>({
  stopAlarm: () => {},
  triggerAlarm: () => {},
  isAlarming: false,
});

export function useTimerAudio() {
  return useContext(TimerAudioContext);
}

export function TimerAudioProvider({ children, userKey }: { children: ReactNode; userKey: string }) {
  const pathname = usePathname();
  const hideBanner = pathname?.startsWith("/timer");
  const [isAlarming, setIsAlarming] = useState(false);
  const [audioSrc, setAudioSrc] = useState(FALLBACK_AUDIO.src);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = `${STORAGE_PREFIX}:${userKey}`;

  useEffect(() => {
    const tick = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (!saved) { setIsAlarming(false); return; }
        const parsed = JSON.parse(saved) as StoredTimer;
        if (parsed.isRunning && parsed.hasAlarmed) {
          setIsAlarming(true);
          if (parsed.audioSrc) setAudioSrc(parsed.audioSrc);
        } else {
          setIsAlarming(false);
        }
      } catch {
        setIsAlarming(false);
      }
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [storageKey]);

  useEffect(() => {
    if (!isAlarming) return;
    const audio = audioRef.current;
    if (!audio) return;

    const playAudio = () => {
      audio.currentTime = 0;
      audio.play().catch(() => undefined);
    };
    const onEnded = () => {
      loopTimeoutRef.current = setTimeout(playAudio, 2500);
    };
    audio.addEventListener("ended", onEnded);
    playAudio();
    return () => {
      audio.removeEventListener("ended", onEnded);
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isAlarming]);

  const stopAlarm = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredTimer;
        parsed.hasAlarmed = false;
        parsed.isRunning = false;
        parsed.deadline = null;
        localStorage.setItem(storageKey, JSON.stringify(parsed));
      }
    } catch {}
    setIsAlarming(false);
  }, [storageKey]);

  const triggerAlarm = useCallback((src: string) => {
    setAudioSrc(src);
    setIsAlarming(true);
  }, []);

  return (
    <TimerAudioContext.Provider value={{ stopAlarm, triggerAlarm, isAlarming }}>
      <audio ref={audioRef} src={audioSrc} preload="auto" />
      {children}
      {isAlarming && !hideBanner && (
        <div className="fixed bottom-24 inset-x-5 z-50 md:bottom-6">
          <div className="bg-red-600 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-white/80" />
              <div>
                <p className="text-sm font-bold">Workout Timer Selesai</p>
                <p className="text-xs text-red-100">Tekan Stop untuk menghentikan alarm</p>
              </div>
            </div>
            <button
              onClick={stopAlarm}
              className="h-9 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition flex items-center gap-1.5 flex-shrink-0"
            >
              <X className="h-4 w-4" />
              Stop
            </button>
          </div>
        </div>
      )}
    </TimerAudioContext.Provider>
  );
}
