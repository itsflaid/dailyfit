# DailyFit — Loading State Improvements

Dokumen ini khusus membahas penambahan/perbaikan loading state di beberapa titik interaksi. Tidak ada bug fungsional di sini — murni peningkatan UX feedback saat user menunggu network request. Ikuti urutan prioritas di bagian bawah.

Prinsip desain yang dipakai di semua poin:
- **Aksi yang sedang diproses** (user klik sesuatu, nunggu server) → feedback di komponen yang diklik (disable + ubah teks/tampilan), bukan skeleton.
- **Data awal yang sedang dimuat** (halaman baru dibuka, belum ada data) → skeleton placeholder seukuran konten asli, bukan spinner, supaya tidak ada layout shift dan tidak ada angka "0" yang menyesatkan.
- Hindari spinner ikon generik (`Loader2` + `animate-spin`) sebagai default — pakai treatment yang sudah konsisten dengan pattern yang ada di codebase (teks "Menyimpan...", skeleton `animate-pulse`, atau shimmer sweep khusus untuk optimistic update).

---

## 1. Loading saat tambah gerakan (checklist "Today")

### File terkait
- `src/app/globals.css`
- `src/app/(dashboard)/today/page.tsx`

### Konteks
Item baru yang ditambahkan ke checklist muncul dulu sebagai optimistic item (`item.id.startsWith("optimistic-")`) sebelum id asli dari server tersedia. Saat ini item tersebut cuma tampil checkbox abu-abu diam tanpa indikasi loading yang jelas.

### Desain
Bukan spinner generik. Pakai treatment yang konsisten dengan brand DailyFit (crimson `#C41230`):
1. Row item pending diberi efek **shimmer sweep** halus (sapuan cahaya diagonal, seperti skeleton loader di Linear/Vercel).
2. Checkbox pending diberi **ring pulsing** warna crimson.
3. Subtitle exercise diganti sementara jadi teks kecil italic **"Menambahkan gerakan…"** warna crimson pudar.

### Langkah 1 — Tambah keyframe shimmer di `src/app/globals.css`

```css
@keyframes shimmer-sweep {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.animate-shimmer {
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    rgba(196, 18, 48, 0.06) 50%,
    transparent 100%
  );
  background-size: 400px 100%;
  background-repeat: no-repeat;
  animation: shimmer-sweep 1.6s ease-in-out infinite;
}
```

### Langkah 2 — Update rendering item di `today/page.tsx` (blok `items.map`, sekitar line ~352-388)

```tsx
{items.map((item) => {
  const isPending = item.id.startsWith("optimistic-");
  return (
    <div
      key={item.id}
      className={`rounded-2xl border p-4 flex items-center gap-3 transition shadow-sm ${
        isPending ? "bg-off animate-shimmer" : "bg-white"
      } ${item.isChecked ? "opacity-70" : ""}`}
    >
      <button
        onClick={() => !isPending && toggle(item.id, item.isChecked)}
        disabled={isPending}
        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
          isPending
            ? "border-primary-400 animate-pulse"
            : item.isChecked
            ? "bg-primary-600 border-primary-600"
            : "border-slate-300 hover:border-primary-400"
        }`}
      >
        {item.isChecked && !isPending && <Check className="h-3.5 w-3.5 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`font-medium text-ink ${item.isChecked ? "line-through text-muted-foreground" : ""}`}>
          {item.exercise.name}
        </div>
        {isPending ? (
          <div className="text-xs text-primary-600/70 italic mt-0.5">Menambahkan gerakan…</div>
        ) : (
          <div className="text-xs text-muted-foreground mt-0.5">
            {exerciseDetail(item.exercise)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground capitalize hidden sm:block">
          {item.source === "plan" ? "rencana" : "manual"}
        </span>
        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border bg-off text-slate-600 border-slate-200 hidden sm:block">
          {CATEGORY_LABEL[item.exercise.category]}
        </span>
      </div>
    </div>
  );
})}
```

### Verifikasi
- Item baru muncul dengan shimmer sweep + ring crimson pulsing + teks "Menambahkan gerakan…".
- Setelah `onSuccess` mengganti data cache dengan id asli, semua efek pending hilang otomatis dan checkbox bisa diklik.

---

## 2. Loading saat hapus rencana / latihan

### File terkait
- `src/app/(dashboard)/plans/page.tsx`
- `src/app/(dashboard)/exercises/page.tsx`

### Konteks
Tombol "Hapus" di modal konfirmasi delete langsung memanggil `fetch(..., { method: "DELETE" })` tanpa disable atau perubahan teks. Bisa ke-double click, dan user tidak tahu proses masih berjalan saat koneksi lambat.

### Desain
Konsisten dengan pattern yang sudah ada di `PlanModal`/`ExerciseModal` ("Menyimpan..."): tambah state `deleting`, disable tombol, ganti teks jadi "Menghapus...".

### Langkah — `src/app/(dashboard)/plans/page.tsx`

Tambah state di dalam komponen:
```tsx
const [deleting, setDeleting] = useState(false);
```

Ganti `handleDelete`:
```tsx
const handleDelete = async () => {
  if (!deleteId) return;
  setDeleting(true);
  const res = await fetch(`/api/plans/${deleteId}`, { method: "DELETE" });
  setDeleting(false);
  setDeleteId(null);
  if (!res.ok) return toast.error("Gagal menghapus");
  toast.success("Rencana dihapus");
  qc.invalidateQueries({ queryKey: ["plans"] });
};
```

Ganti tombol "Hapus" di modal konfirmasi:
```tsx
<button
  onClick={handleDelete}
  disabled={deleting}
  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-60"
  style={{ background: "#C41230" }}
  onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.background = "#9B0E25"; }}
  onMouseLeave={(e) => { if (!deleting) e.currentTarget.style.background = "#C41230"; }}
>
  {deleting ? "Menghapus..." : "Hapus"}
</button>
```

### Langkah — `src/app/(dashboard)/exercises/page.tsx`

Terapkan pola yang sama persis: tambah `const [deleting, setDeleting] = useState(false);`, bungkus `handleDelete` dengan `setDeleting(true/false)`, dan ubah tombol "Hapus" di modal konfirmasi (sekitar line ~201-209) jadi:
```tsx
<button
  onClick={handleDelete}
  disabled={deleting}
  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-60"
  style={{ background: "#C41230" }}
  onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.background = "#9B0E25"; }}
  onMouseLeave={(e) => { if (!deleting) e.currentTarget.style.background = "#C41230"; }}
>
  {deleting ? "Menghapus..." : "Hapus"}
</button>
```

### Verifikasi
- Klik "Hapus" langsung men-disable tombol dan teks berubah jadi "Menghapus...".
- Tombol tidak bisa diklik dua kali selama request berjalan.

---

## 3. Loading saat sign out di Profile page

### File terkait
- `src/app/(dashboard)/profile/page.tsx`

### Konteks
`handleSignOut` memanggil `signOut()` lalu `router.push("/login")` tanpa loading state di tombolnya.

### Langkah

Tambah state:
```tsx
const [signingOut, setSigningOut] = useState(false);
```

Ganti `handleSignOut`:
```tsx
const handleSignOut = async () => {
  setSigningOut(true);
  await signOut({ redirect: false });
  router.push("/login");
};
```

Ganti tombol "Keluar":
```tsx
<button
  onClick={handleSignOut}
  disabled={signingOut}
  className="flex items-center gap-2 border border-primary-600 text-primary-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-50 transition disabled:opacity-60"
>
  <LogOut className="h-4 w-4" />
  {signingOut ? "Keluar..." : "Keluar"}
</button>
```

Tidak perlu `setSigningOut(false)` karena setelah `router.push("/login")` komponen ini akan unmount.

---

## 4. Skeleton loading di Dashboard/Home page

### File terkait
- `src/app/(dashboard)/page.tsx`

### Konteks
Ini halaman pertama yang dibuka user setiap masuk app. Saat ini fetch `/api/stats` tidak punya `isLoading` handling sama sekali — akibatnya sepersekian detik pertama nongol **"Streak 0 hari"** dan progress **0%** (data kosong dianggap valid), baru lompat ke angka asli setelah fetch selesai. Ini bukan cuma kurang loading, tapi menampilkan data yang salah sesaat.

### Desain
Ini bukan "aksi sedang diproses" seperti poin 1-3, tapi "data awal sedang dimuat" — jadi treatment-nya **skeleton placeholder seukuran konten asli**, konsisten dengan pattern yang sudah dipakai di Plans page dan Exercises page (`animate-pulse` block abu-abu), bukan shimmer sweep (yang khusus dipakai untuk optimistic action) dan bukan spinner.

Bagian yang butuh skeleton:
- Badge "Streak X hari" di header crimson
- 2 kartu stat: "Minggu Ini" dan "Streak Saat Ini"

Bagian yang **tidak** butuh skeleton: 2 card shortcut (Checklist Hari Ini, Pustaka Latihan) karena isinya statis, tidak bergantung ke data stats.

### Langkah 1 — Ambil `isLoading` dari query

Ganti:
```tsx
const { data: stats } = useQuery({
  queryKey: ["stats"],
  queryFn: () => fetch("/api/stats").then((r) => r.json()),
});
```
Menjadi:
```tsx
const { data: stats, isLoading } = useQuery({
  queryKey: ["stats"],
  queryFn: () => fetch("/api/stats").then((r) => r.json()),
});
```

### Langkah 2 — Skeleton badge streak di header

Ganti blok badge (sekitar line ~32-35):
```tsx
<div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium">
  <Flame className="h-4 w-4" />
  Streak {stats?.streak ?? 0} hari
</div>
```
Menjadi:
```tsx
{isLoading ? (
  <div className="inline-block h-7 w-32 rounded-full bg-white/15 animate-pulse" />
) : (
  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium">
    <Flame className="h-4 w-4" />
    Streak {stats.streak ?? 0} hari
  </div>
)}
```

### Langkah 3 — Skeleton 2 kartu stat

Ganti seluruh blok `<div className="grid sm:grid-cols-2 gap-4">...</div>` pertama (yang berisi kartu "Minggu Ini" dan "Streak Saat Ini", sekitar line ~38-69):

```tsx
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
```

### Verifikasi
- Saat halaman dibuka, badge streak dan 2 kartu stat tampil sebagai skeleton pulsing seukuran konten asli (tidak ada layout shift).
- Tidak ada lagi "Streak 0 hari" atau progress 0% yang tampil sesaat sebelum data asli masuk.
- Setelah fetch selesai, skeleton digantikan data asli secara instan.

---

## Ringkasan Prioritas Eksekusi

1. **Dashboard/Home page skeleton** (poin 4) — paling sering dilihat, paling misleading karena nampilin data salah.
2. **Loading tambah gerakan** (poin 1) — paling sering berinteraksi, sudah didiskusikan dan didesain paling detail.
3. **Loading hapus rencana/latihan** (poin 2) — mencegah double-click, minor tapi mudah dikerjakan.
4. **Loading sign out** (poin 3) — paling minor, opsional.