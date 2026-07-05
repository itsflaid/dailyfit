# DailyFit — Fitur Export Weekly Report (PDF)

Fitur baru: export laporan progres 7 hari terakhir (rolling window, bukan Senin-Minggu kalender) ke file PDF. Dokumen ini berisi keputusan desain + instruksi implementasi lengkap.

---

## Bagian 1 — Keputusan Desain (dibaca dulu sebelum lihat kode)

### Periode: rolling 7 hari, bukan kalender mingguan
Export tanggal 5 Juli → cakup 5, 4, 3, 2, 1 Juli + 30, 29 Juni. Urutan tampil **dari terbaru ke terlama** (Hari 1 = tanggal export, Hari 7 = 6 hari sebelumnya) — sesuai urutan yang diminta.

### Library yang dipakai: `@react-pdf/renderer`
Alasan milih ini dibanding alternatif lain:
- **Bukan** `jsPDF + html2canvas` — hasil render dari canvas biasanya pecah/blur pas di-print dan sulit dikontrol page-break-nya.
- **Bukan** Puppeteer/headless browser — berat, butuh binary Chromium terpisah, ribet di-deploy ke serverless (Vercel), overkill buat dokumen sesederhana ini.
- `@react-pdf/renderer` — generate PDF murni dari komponen React (`<Document>`, `<Page>`, `<View>`, `<Text>`), ringan, jalan baik di API route Next.js, dan gampang dikontrol layout-nya.

### Layout: card per hari dengan garis pembatas, BUKAN kotak penuh
Kalau tiap hari dibungkus box/border penuh dan kontennya kepanjangan (banyak exercise), box itu bisa "putus" aneh pas pindah halaman PDF. Solusinya: tiap hari cukup pakai **heading dengan garis bawah tipis** (bukan box tertutup), jadi kalau kontennya nyambung ke halaman berikutnya, tetap enak dibaca — gak ada tepi kotak yang keliatan terpotong.

### Kalau 1 hari punya banyak exercise (>4 item): otomatis jadi 2 kolom
Supaya daftar gak jadi kepanjangan ke bawah kalau user rajin banget dalam sehari, list exercise di-render 2 kolom kalau jumlahnya lebih dari 4 item. Kalau ≤4, tetap 1 kolom (lebih gampang dibaca buat hari yang santai).

### Visualisasi: mini bar "intensitas harian" (relatif terhadap hari tersibuk minggu itu)
Bukan grafik rumit — cukup 1 bar tipis di tiap heading hari, panjangnya proporsional terhadap jumlah exercise hari itu dibanding hari paling sibuk dalam periode 7 hari itu. Ini kasih gambaran "pace" mingguan sekilas pandang tanpa perlu baca detail tiap hari.

### Hari tanpa latihan: ditampilkan netral, bukan dengan nada negatif
Teks "Tidak ada latihan" dengan warna abu-abu pudar dan tanpa bar intensitas — bukan tanda silang merah atau kata-kata yang kesannya "gagal". Rest day itu wajar, PDF-nya harus reflect itu secara netral.

### Ringkasan akhir — 3 wajib + 1 opsional
Wajib (sesuai request): total hari latihan (ditampilkan sebagai 7 dot, terisi/kosong — representasi visual cepat), total exercise dilakukan, exercise paling sering.
Opsional tapi saya rekomendasikan: breakdown kategori (Strength/Cardio/Balance/Flexibility) sebagai mini horizontal bar chart — data ini udah ada di sistem (dipakai juga di halaman Stats), nambah kesan "laporan progres" yang lebih dari sekadar daftar centang, dan gak nambah kerumitan besar karena reuse pola yang mirip.

### Yang SENGAJA tidak dimasukkan
- Detail per-set (misal "set 1: 15 reps, set 2: 15 reps") — kegranularan ini gak nambah value buat laporan mingguan, cukup total agregat per exercise per hari (konsisten sama contoh yang diminta: "Push Up: 30x", bukan breakdown per set).
- Jam/waktu spesifik tiap checklist ditekan — gak relevan buat laporan ringkasan mingguan.
- Nama font custom (Barlow Condensed/DM Sans) di tahap awal — `@react-pdf/renderer` butuh font di-register manual dari file/URL, nambah kompleksitas dan resiko gagal load. Pakai font default dulu (Helvetica), custom font bisa ditambah belakangan sebagai polish kalau MVP-nya udah jalan.

### Header: banner block crimson full-bleed, bukan teks polos di atas putih
Versi awal (teks judul+info bertumpuk di atas putih) kurang kerasa "premium" — gak ada elemen brand yang dominan. Diganti jadi: **blok background crimson penuh lebar** di paling atas halaman (full-bleed, nempel ke tepi kertas), isinya brand mark "DAILYFIT" kecil di atas, judul laporan besar-bold, lalu periode laporan — semua teks putih di atas crimson. Info sekunder (nama user + tanggal dibuat) ditaruh **di luar/bawah banner**, kecil dan rata kanan, biar gak menyaingi header utama secara visual.

### Warna
Konsisten sama brand DailyFit: crimson `#C41230` buat heading/aksen/bar, hitam buat teks utama, abu-abu buat teks sekunder/rest day.

### Cara trigger
Tombol "Export Laporan Mingguan (PDF)" ditaruh di halaman **Stats** (paling nyambung tematik — itu udah jadi pusat analitik). Klik → fetch API → download file PDF langsung (tanpa buka tab baru), dengan loading state di tombol ("Menyiapkan PDF..." + disable), konsisten sama pola loading state yang udah diterapkan di bagian lain app.

---

## Bagian 2 — Implementasi

### Langkah 1 — Install dependency

```bash
npm install @react-pdf/renderer
```

### Langkah 2 — Query & agregasi data: `src/lib/reports/weekly.ts` (file baru)

```ts
import { prisma } from "@/lib/prisma";
import { ExerciseCategory } from "@prisma/client";

export type WeeklyReportExerciseLine = {
  name: string;
  amount: number;
  unit: "x" | "detik";
  category: ExerciseCategory;
};

export type WeeklyReportDay = {
  dayNumber: number; // 1 = hari export, 7 = 6 hari sebelumnya
  date: Date;
  exercises: WeeklyReportExerciseLine[];
  totalCount: number;
};

export type WeeklyReportSummary = {
  daysTrained: number;
  totalExercises: number;
  topExercise: { name: string; count: number } | null;
  categoryBreakdown: { category: ExerciseCategory; count: number }[];
};

export type WeeklyReportData = {
  userName: string;
  periodLabel: string;
  generatedAt: Date;
  days: WeeklyReportDay[];
  summary: WeeklyReportSummary;
};

const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  STRENGTH: "Kekuatan",
  CARDIO: "Kardio",
  BALANCE: "Keseimbangan",
  FLEXIBILITY: "Fleksibilitas",
};

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatPeriodLabel(from: Date, to: Date) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  const fromLabel = from.toLocaleDateString("id-ID", opts);
  const toLabel = to.toLocaleDateString("id-ID", { ...opts, year: "numeric" });
  return `${fromLabel} - ${toLabel}`;
}

export async function getWeeklyReportData(userId: string, userName: string): Promise<WeeklyReportData> {
  const anchor = startOfDay(new Date());
  const earliest = new Date(anchor);
  earliest.setDate(earliest.getDate() - 6);

  const logs = await prisma.dailyLog.findMany({
    where: { userId, date: { gte: earliest, lte: anchor } },
    include: {
      items: {
        where: { isChecked: true },
        include: { exercise: true },
      },
    },
  });

  const logsByDateKey = new Map(logs.map((log) => [startOfDay(log.date).toISOString(), log]));

  const days: WeeklyReportDay[] = [];
  const exerciseCountAll: Record<string, { name: string; count: number }> = {};
  const categoryCount: Record<ExerciseCategory, number> = {
    STRENGTH: 0,
    CARDIO: 0,
    BALANCE: 0,
    FLEXIBILITY: 0,
  };
  let daysTrained = 0;
  let totalExercises = 0;

  for (let i = 0; i < 7; i++) {
    const date = new Date(anchor);
    date.setDate(date.getDate() - i);
    const log = logsByDateKey.get(startOfDay(date).toISOString());

    const grouped = new Map<string, WeeklyReportExerciseLine>();
    for (const item of log?.items ?? []) {
      const ex = item.exercise;
      const isTimeBased = ex.type === "TIME_BASED";
      const amount = isTimeBased
        ? ex.durationSeconds ?? 0
        : (ex.reps ?? 0) * (ex.sets ?? 1);

      const existing = grouped.get(ex.id);
      if (existing) {
        existing.amount += amount;
      } else {
        grouped.set(ex.id, {
          name: ex.name,
          amount,
          unit: isTimeBased ? "detik" : "x",
          category: ex.category,
        });
      }

      exerciseCountAll[ex.id] = exerciseCountAll[ex.id]
        ? { name: ex.name, count: exerciseCountAll[ex.id].count + 1 }
        : { name: ex.name, count: 1 };
      categoryCount[ex.category] += 1;
      totalExercises += 1;
    }

    const exercises = Array.from(grouped.values());
    if (exercises.length > 0) daysTrained += 1;

    days.push({
      dayNumber: i + 1,
      date,
      exercises,
      totalCount: exercises.length,
    });
  }

  const topExerciseEntry = Object.values(exerciseCountAll).sort((a, b) => b.count - a.count)[0] ?? null;

  return {
    userName,
    periodLabel: formatPeriodLabel(earliest, anchor),
    generatedAt: new Date(),
    days,
    summary: {
      daysTrained,
      totalExercises,
      topExercise: topExerciseEntry,
      categoryBreakdown: (Object.keys(categoryCount) as ExerciseCategory[])
        .map((category) => ({ category, count: categoryCount[category] }))
        .filter((c) => c.count > 0)
        .sort((a, b) => b.count - a.count),
    },
  };
}

export { CATEGORY_LABEL };
```

### Langkah 3 — Komponen PDF: `src/lib/reports/WeeklyReportPdf.tsx` (file baru)

```tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { WeeklyReportData } from "./weekly";
import { CATEGORY_LABEL } from "./weekly";

const CRIMSON = "#C41230";
const INK = "#0F0A0B";
const MUTED = "#8A8A8A";
const OFF = "#F6F4F1";

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, color: INK, fontFamily: "Helvetica" },
  content: { padding: 32 },
  headerBanner: { backgroundColor: CRIMSON, paddingVertical: 28, paddingHorizontal: 32, marginBottom: 4 },
  headerBrand: { fontSize: 10, fontWeight: 700, color: "#FFFFFF", letterSpacing: 2, marginBottom: 8, opacity: 0.85 },
  headerTitle: { fontSize: 22, fontWeight: 700, color: "#FFFFFF", marginBottom: 6 },
  headerPeriod: { fontSize: 11, color: "#FFFFFF", opacity: 0.9 },
  headerMetaRow: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 32, paddingTop: 10, marginBottom: 8 },
  headerMetaText: { fontSize: 8, color: MUTED },
  divider: { height: 1, backgroundColor: "#E5E0DA", marginVertical: 14 },
  dayHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  dayLabel: { fontSize: 12, fontWeight: 700, color: INK },
  dayDate: { fontSize: 9, color: MUTED },
  intensityBarTrack: { height: 3, backgroundColor: "#EFEAE3", borderRadius: 2, marginBottom: 8, marginTop: 2 },
  intensityBarFill: { height: 3, backgroundColor: CRIMSON, borderRadius: 2 },
  exerciseGrid: { flexDirection: "row", flexWrap: "wrap" },
  exerciseLine1Col: { width: "100%", fontSize: 10, marginBottom: 3, flexDirection: "row" },
  exerciseLine2Col: { width: "50%", fontSize: 10, marginBottom: 3, paddingRight: 8, flexDirection: "row" },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 3, marginRight: 6 },
  exerciseName: { color: INK },
  exerciseAmount: { color: MUTED },
  restDay: { fontSize: 10, color: MUTED, fontStyle: "italic", marginBottom: 8 },
  dayBlock: { marginBottom: 16 },
  summaryBox: { backgroundColor: OFF, borderRadius: 8, padding: 16, marginTop: 8 },
  summaryTitle: { fontSize: 13, fontWeight: 700, color: INK, marginBottom: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontSize: 9, color: MUTED },
  summaryValue: { fontSize: 11, fontWeight: 700, color: INK },
  dotsRow: { flexDirection: "row", marginTop: 3 },
  dayDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  categoryBarRow: { marginBottom: 6 },
  categoryBarLabel: { fontSize: 8, color: MUTED, marginBottom: 2 },
  categoryBarTrack: { height: 5, backgroundColor: "#EFEAE3", borderRadius: 3 },
  categoryBarFill: { height: 5, backgroundColor: CRIMSON, borderRadius: 3 },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 8, color: MUTED, textAlign: "center" },
});

const CATEGORY_COLOR: Record<string, string> = {
  STRENGTH: "#C41230",
  CARDIO: "#2563EB",
  BALANCE: "#16A34A",
  FLEXIBILITY: "#9333EA",
};

const WEEKDAY = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function formatFullDate(d: Date) {
  return `${WEEKDAY[d.getDay()]}, ${d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
}

export function WeeklyReportPdf({ data }: { data: WeeklyReportData }) {
  const maxCount = Math.max(1, ...data.days.map((d) => d.totalCount));
  const maxCategoryCount = Math.max(1, ...data.summary.categoryBreakdown.map((c) => c.count));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header banner — full-bleed crimson */}
        <View style={styles.headerBanner}>
          <Text style={styles.headerBrand}>DAILYFIT</Text>
          <Text style={styles.headerTitle}>Laporan Progres Mingguan</Text>
          <Text style={styles.headerPeriod}>{data.periodLabel}</Text>
        </View>

        {/* Meta info sekunder — di luar banner, rata kanan, kecil */}
        <View style={styles.headerMetaRow}>
          <Text style={styles.headerMetaText}>
            {data.userName} · Dibuat {data.generatedAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </View>

        <View style={styles.content}>
        <View style={styles.divider} />

        {/* Per-day sections */}
        {data.days.map((day) => {
          const useGrid = day.exercises.length > 4;
          return (
            <View key={day.dayNumber} style={styles.dayBlock} wrap>
              <View style={styles.dayHeaderRow}>
                <Text style={styles.dayLabel}>Hari {day.dayNumber}</Text>
                <Text style={styles.dayDate}>{formatFullDate(day.date)}</Text>
              </View>

              {day.exercises.length > 0 && (
                <View style={styles.intensityBarTrack}>
                  <View
                    style={[
                      styles.intensityBarFill,
                      { width: `${(day.totalCount / maxCount) * 100}%` },
                    ]}
                  />
                </View>
              )}

              {day.exercises.length === 0 ? (
                <Text style={styles.restDay}>Tidak ada latihan</Text>
              ) : (
                <View style={styles.exerciseGrid}>
                  {day.exercises.map((ex, idx) => (
                    <View key={idx} style={useGrid ? styles.exerciseLine2Col : styles.exerciseLine1Col}>
                      <View style={[styles.dot, { backgroundColor: CATEGORY_COLOR[ex.category] }]} />
                      <Text>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        <Text style={styles.exerciseAmount}>{"  "}{ex.amount}{ex.unit === "x" ? "x" : " detik"}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.divider} />

        {/* Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Ringkasan Minggu Ini</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Hari Latihan</Text>
            <View>
              <Text style={styles.summaryValue}>{data.summary.daysTrained} dari 7 hari</Text>
              <View style={styles.dotsRow}>
                {data.days.slice().reverse().map((d) => (
                  <View
                    key={d.dayNumber}
                    style={[
                      styles.dayDot,
                      { backgroundColor: d.totalCount > 0 ? CRIMSON : "#E5E0DA" },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Exercise Dilakukan</Text>
            <Text style={styles.summaryValue}>{data.summary.totalExercises}x</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Exercise Paling Sering</Text>
            <Text style={styles.summaryValue}>
              {data.summary.topExercise
                ? `${data.summary.topExercise.name} (${data.summary.topExercise.count}x)`
                : "-"}
            </Text>
          </View>

          {data.summary.categoryBreakdown.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.summaryLabel, { marginBottom: 6 }]}>Breakdown Tipe Latihan</Text>
              {data.summary.categoryBreakdown.map((c) => (
                <View key={c.category} style={styles.categoryBarRow}>
                  <Text style={styles.categoryBarLabel}>
                    {CATEGORY_LABEL[c.category]} ({c.count}x)
                  </Text>
                  <View style={styles.categoryBarTrack}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        {
                          width: `${(c.count / maxCategoryCount) * 100}%`,
                          backgroundColor: CATEGORY_COLOR[c.category],
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        </View>

        <Text style={styles.footer} fixed>
          Dibuat otomatis oleh DailyFit — laporan ini mencerminkan aktivitas checklist yang tercatat di aplikasi.
        </Text>
      </Page>
    </Document>
  );
}
```

### Langkah 4 — API route: `src/app/api/reports/weekly/route.ts` (file baru)

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // sesuaikan path ke authOptions yang sudah ada di project
import { renderToBuffer } from "@react-pdf/renderer";
import { getWeeklyReportData } from "@/lib/reports/weekly";
import { WeeklyReportPdf } from "@/lib/reports/WeeklyReportPdf";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const data = await getWeeklyReportData(session.user.id, session.user.name ?? "Pengguna");
  const buffer = await renderToBuffer(WeeklyReportPdf({ data }));

  const filename = `dailyfit-laporan-mingguan-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

**Catatan:** sesuaikan import `authOptions` dengan lokasi yang sudah ada di project (cek `src/app/api/auth/[...nextauth]/route.ts` untuk konfirmasi nama export dan path-nya).

### Langkah 5 — Tombol export di halaman Stats

Di `src/app/(dashboard)/stats/page.tsx`, tambah state dan handler:

```tsx
const [isExporting, setIsExporting] = useState(false);

const handleExportPdf = async () => {
  setIsExporting(true);
  try {
    const res = await fetch("/api/reports/weekly");
    if (!res.ok) throw new Error("Gagal membuat laporan");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dailyfit-laporan-mingguan-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error("Gagal mengekspor laporan, coba lagi.");
  } finally {
    setIsExporting(false);
  }
};
```

Tambah tombolnya di bagian atas halaman Stats (dekat judul halaman):
```tsx
<button
  onClick={handleExportPdf}
  disabled={isExporting}
  className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-60"
>
  <FileDown className="h-4 w-4" />
  {isExporting ? "Menyiapkan PDF..." : "Export Laporan Mingguan"}
</button>
```

Import icon tambahan:
```tsx
import { FileDown } from "lucide-react";
```

---

## Verifikasi
- Klik tombol export di halaman Stats → tombol berubah jadi "Menyiapkan PDF..." + disabled selama proses.
- File PDF terunduh otomatis dengan nama `dailyfit-laporan-mingguan-YYYY-MM-DD.pdf`.
- Isi PDF: header (judul, nama app, nama user, periode, tanggal dibuat) → 7 hari berurutan dari terbaru ke terlama, tiap hari ada bar intensitas relatif (kecuali rest day), list exercise 1 kolom (≤4 item) atau 2 kolom (>4 item), rest day tampil netral dengan teks italic abu-abu.
- Ringkasan di akhir: total hari latihan dengan 7 dot indikator, total exercise, exercise paling sering, breakdown kategori sebagai mini bar chart.
- Coba dengan user yang belum ada aktivitas sama sekali dalam 7 hari → semua hari tampil "Tidak ada latihan", ringkasan tampil "0 dari 7 hari", "Exercise Paling Sering: -", tanpa error/crash.
- Coba dengan 1 hari yang punya banyak exercise (>4) → otomatis pindah ke layout 2 kolom di hari itu saja, hari lain tetap 1 kolom kalau ≤4 item.