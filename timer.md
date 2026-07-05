# DailyFit — Timer Fixes: Banner Duplikat, Delay Alarm, Template

Tiga perbaikan di fitur Workout Timer. File terkait:
- `src/components/layout/TimerAudioProvider.tsx`
- `src/components/layout/WorkoutTimer.tsx`

---

## 1. Sembunyikan banner "Workout Timer Selesai" di halaman `/timer`

### Root cause
`TimerAudioProvider` dipasang global di `app-shell.tsx`, jadi banner-nya muncul di semua halaman termasuk `/timer` sendiri — padahal di situ udah ada UI overtime (background merah + tombol "Stop") bawaan `WorkoutTimer.tsx`. Banner jadi duplikat.

### Fix
Deteksi route aktif pakai `usePathname`, sembunyikan banner kalau lagi di `/timer` (audio tetap harus jalan, cuma UI banner-nya yang disembunyikan).

Di `TimerAudioProvider.tsx`, tambah import dan logic:

```tsx
import { usePathname } from "next/navigation";
```

Di dalam komponen `TimerAudioProvider`, tambah:
```tsx
const pathname = usePathname();
const hideBanner = pathname?.startsWith("/timer");
```

Ganti kondisi render banner:
```tsx
{isAlarming && !hideBanner && (
  <div className="fixed bottom-24 inset-x-5 z-50 md:bottom-6">
    ...
  </div>
)}
```

---

## 2. Fix delay alarm — harus presisi di detik ke-0, bukan ke-1

### Root cause (2 lapis, keduanya harus dibenerin)

**Lapis 1 — `WorkoutTimer.tsx`:** `hasAlarmed` di-set lewat `setInterval(tick, 1000)` yang jadwalnya gak sinkron ke momen persis deadline tercapai. Bisa telat sampai hampir 1 detik.

**Lapis 2 — `TimerAudioProvider.tsx`:** provider ini polling `localStorage` tiap 1000ms terpisah dari `WorkoutTimer`, nambah lagi sampai hampir 1 detik delay di atas lapis 1.

### Fix Lapis 1 — jadwalkan `setTimeout` presisi ke momen deadline

Di `WorkoutTimer.tsx`, cari effect alarm ini:
```tsx
// ─── Alarm ───────────────────────────────────────────────────────────────
useEffect(() => {
  if (!isRunning || hasAlarmed || secondsLeft > 0) return;
  setHasAlarmed(true);
}, [hasAlarmed, isRunning, secondsLeft]);
```

Ganti jadi (pakai `setTimeout` dihitung dari selisih ms ke `deadline`, bukan nunggu tick 1 detik):
```tsx
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
```

### Fix Lapis 2 — langsung panggil context, bukan cuma nunggu poll

Selama `WorkoutTimer` masih mounted (user lagi di halaman `/timer`), alarm harus nyala instan (0ms) lewat pemanggilan context langsung — bukan nunggu provider poll localStorage. Poll di provider tetap dipertahankan sebagai fallback untuk kasus "user udah pindah halaman" (saat itu `WorkoutTimer` ter-unmount, jadi cuma poll yang bisa mendeteksi).

Di `TimerAudioProvider.tsx`, tambah fungsi `triggerAlarm` ke context:

```tsx
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
```

Tambah implementasinya di dalam `TimerAudioProvider`:
```tsx
const triggerAlarm = useCallback((src: string) => {
  setAudioSrc(src);
  setIsAlarming(true);
}, []);
```

Update return value provider:
```tsx
<TimerAudioContext.Provider value={{ stopAlarm, triggerAlarm, isAlarming }}>
```

Turunkan juga interval poll dari 1000ms jadi 200ms — ini jadi jaring pengaman buat kasus lintas halaman (user udah pindah dari `/timer`), supaya delay maksimalnya gak lebih dari 200ms (jauh lebih presisi dari 1000ms sebelumnya):
```tsx
const id = setInterval(tick, 200);
```

Di `WorkoutTimer.tsx`, import dan pakai context:
```tsx
import { useTimerAudio } from "./TimerAudioProvider";
```

Di dalam komponen, ambil fungsi context:
```tsx
const { triggerAlarm, stopAlarm } = useTimerAudio();
```

Tambah effect baru yang langsung sinkronin status alarm ke context real-time (tanpa nunggu poll):
```tsx
// ─── Sync status alarm ke context secara instan ──────────────────────────
useEffect(() => {
  if (isRunning && hasAlarmed) {
    triggerAlarm(audioSrc);
  } else {
    stopAlarm();
  }
}, [isRunning, hasAlarmed, audioSrc, triggerAlarm, stopAlarm]);
```

Dengan ini: kalau user masih di halaman `/timer` pas waktu habis, alarm nyala instan (0ms, langsung lewat context). Kalau user udah pindah halaman, provider tetap nemuin lewat poll 200ms (jauh lebih presisi dari 1000ms sebelumnya).

---

## 3. Preset Timer (simpan di localStorage)

### Desain alur
- Label **"Preset"** (atau **"Preset: (nama)"** kalau lagi ada yang aktif) jadi tombol trigger — diklik baru buka panel dropdown, bukan section yang selalu terbuka.
- Panel isinya: baris **"+ Tambah Preset"** di paling atas, lalu list preset tersimpan.
- Tiap baris preset: nama + durasi, plus 2 icon di kanan — **pensil (edit)** dan **hapus (delete)**.
- Klik baris preset (bukan icon) → preset diterapkan (cuma **durasi**, audio TIDAK ikut tersimpan/diterapkan dari preset — selalu ikut apapun yang lagi aktif di dropdown Audio), panel tertutup, label berubah jadi "Preset: (nama)".
- Klik "+ Tambah Preset" atau icon pensil → modal muncul isi field **nama** + **durasi** (reuse native time picker yang sama kayak input Durasi utama).
- Preset **cuma nyimpen `name` dan `duration`** — tidak menyimpan audio sama sekali.
- Kalau user ubah durasi manual lewat input Durasi utama (bukan lewat pilih preset), preset yang lagi "aktif" ke-deselect otomatis — label balik jadi "Preset" polos (karena durasi udah gak match preset manapun).

### Langkah — `WorkoutTimer.tsx`

Tambah type & konstanta:
```tsx
type TimerPreset = {
  id: string;
  name: string;
  duration: number;
};

const PRESET_STORAGE_PREFIX = "dailyfit-timer-presets";
```

Tambah state di dalam komponen:
```tsx
const [presets, setPresets] = useState<TimerPreset[]>([]);
const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
const [isPresetPanelOpen, setIsPresetPanelOpen] = useState(false);
const [presetModal, setPresetModal] = useState<
  { mode: "add" } | { mode: "edit"; id: string } | null
>(null);
const [presetModalName, setPresetModalName] = useState("");
const [presetModalDuration, setPresetModalDuration] = useState(DEFAULT_SECONDS);

const presetStorageKey = `${PRESET_STORAGE_PREFIX}:${userKey ?? "guest"}`;
const selectedPreset = presets.find((p) => p.id === selectedPresetId) ?? null;
```

Tambah effect load preset saat mount:
```tsx
// ─── Load presets ──────────────────────────────────────────────────────
useEffect(() => {
  try {
    const saved = window.localStorage.getItem(presetStorageKey);
    if (saved) setPresets(JSON.parse(saved));
  } catch {
    window.localStorage.removeItem(presetStorageKey);
  }
}, [presetStorageKey]);
```

Tambah fungsi buka modal (add/edit), simpan, terapkan, dan hapus:
```tsx
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
```

Update `handleDurationChange` supaya deselect preset kalau durasi diubah manual (cari fungsi existing dan tambah satu baris):
```tsx
const handleDurationChange = (value: string) => {
  const next = parseTimerInput(value);
  setDuration(next);
  setSelectedPresetId(null); // durasi diubah manual → preset aktif jadi gak valid lagi
};
```

Ganti bagian label "Durasi" di grid Duration/Audio — tambah trigger Preset **di atas** label "Durasi" (masih di dalam grid yang sama, jadi bikin grid jadi 1 kolom penuh untuk row Preset, lalu grid 2 kolom untuk Durasi/Audio seperti sebelumnya):

```tsx
{/* Preset trigger */}
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
```

Import icon yang dipakai di atas file:
```tsx
import { ChevronDown, Plus, Pencil, Trash2 } from "lucide-react";
```

Tambah modal add/edit preset — taruh di akhir JSX komponen (sejajar dengan return utama, render kondisional):
```tsx
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
```

### Verifikasi
- Label default nampilin "Preset" polos, gak ada panel/list yang otomatis kebuka.
- Klik label → panel muncul isi "+ Tambah Preset" di atas + list preset (atau pesan kosong kalau belum ada).
- Klik "+ Tambah Preset" → modal muncul, isi nama + pilih durasi, klik Simpan → preset baru masuk list.
- Klik salah satu baris preset (bukan icon) → durasi ke-set sesuai preset, panel tertutup, label berubah jadi "Preset: (nama)", **audio tidak berubah** (tetap ikut apa yang lagi aktif di dropdown Audio).
- Klik icon pensil → modal edit terbuka dengan nama+durasi lama ter-prefill, ubah, Simpan → preset ter-update di list.
- Klik icon hapus → preset hilang dari list; kalau yang dihapus itu yang lagi aktif, label balik jadi "Preset" polos.
- Ubah durasi manual lewat input "Durasi" (bukan lewat preset) → label preset otomatis balik ke "Preset" polos (deselect).
- Refresh halaman → preset tetap ada (persisted di localStorage).

---

## Verifikasi keseluruhan
- Buka `/timer`, mulai timer durasi pendek (misal 5 detik) → tunggu sampai habis: alarm harus bunyi **tepat** pas display nunjukin 0:00, bukan telat ke -0:01, dan **tidak ada banner floating muncul** (karena UI overtime bawaan halaman timer udah cukup).
- Mulai timer, lalu pindah ke halaman lain (misal Home) sebelum waktu habis → begitu waktu habis, banner floating muncul di halaman lain itu dengan delay maksimal ~200ms, ada tombol Stop yang berfungsi.
- Simpan & terapkan template berjalan sesuai poin 3 di atas.