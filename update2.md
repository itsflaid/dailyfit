# DailyFit — Heatmap "Membara" Effect (15+ gerakan/hari)

Fitur gamifikasi kecil: kotak heatmap aktivitas tahunan dapat treatment visual khusus kalau jumlah gerakan yang di-checklist pada hari itu ≥15. Bukan bug fix, murni enhancement visual.

## File terkait
- `src/app/globals.css` — tambah keyframe & class animasi
- `src/components/stats/HeatmapActivity.tsx` — terapkan class ke cell + update tooltip

## Desain

- Threshold: `count >= 15` → cell dapat class `.heatmap-blaze` menggantikan warna solid biasa.
- Background: gradient oranye→kuning→merah yang looping, bergerak **diagonal dari kanan bawah ke kiri atas** secara terus-menerus (bukan diam, bukan cuma pulsing opacity).
- Glow diperkecil (blur 1-3px) supaya gak dominan kalau ada beberapa kotak "membara" berdekatan di grid.
- Tooltip untuk cell blaze menampilkan emoji 🔥 + teks tambahan, beda dari tooltip biasa.
- **Wajib** hormati `prefers-reduced-motion: reduce` — user yang set preferensi ini di OS dapat versi statis (gradient diam di posisi tengah, tanpa animasi geser maupun glow pulsing).

## Langkah 1 — Tambah CSS di `src/app/globals.css`

```css
@keyframes heatmap-blaze-shift {
  0% { background-position: 100% 100%; }
  100% { background-position: 0% 0%; }
}

@keyframes heatmap-blaze-glow {
  0%, 100% { box-shadow: 0 0 1px 0.5px rgba(255, 90, 31, 0.35); }
  50% { box-shadow: 0 0 3px 1.5px rgba(255, 140, 0, 0.6); }
}

.heatmap-blaze {
  background-image: linear-gradient(135deg, #ff5a1f, #ffb703, #c41230, #ff5a1f, #ffb703);
  background-size: 300% 300%;
  animation: heatmap-blaze-shift 2.2s linear infinite, heatmap-blaze-glow 2.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .heatmap-blaze {
    animation: none;
    background-position: 50% 50%;
  }
}
```

## Langkah 2 — Update `src/components/stats/HeatmapActivity.tsx`

Tambah konstanta di dekat `LEVEL_COLORS` (line ~6):
```ts
const BLAZE_THRESHOLD = 15;
```

Ganti isi `week.map((date, di) => { ... })` di bagian grid cell (sekitar line 175-218):

```tsx
{week.map((date, di) => {
  const key = formatKey(date);
  const count = heatmapData?.[key] ?? 0;
  const isBlaze = count >= BLAZE_THRESHOLD;
  const color = getColor(count);
  const isToday = key === formatKey(new Date());

  return (
    <div
      key={di}
      className={isBlaze ? "heatmap-blaze" : undefined}
      style={{
        width: CELL,
        height: CELL,
        borderRadius: 2,
        background: isBlaze ? undefined : color,
        border: isToday
          ? "1.5px solid #C41230"
          : count === 0
          ? "1px solid rgba(0,0,0,0.08)"
          : "none",
        cursor: "pointer",
        transition: "transform 0.1s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1.3)";
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
          date: date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          count,
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
        setTooltip(null);
      }}
    />
  );
})}
```

Catatan: jangan set `background` inline saat `isBlaze` true (biarkan `undefined`) — supaya `background-image` dari class `.heatmap-blaze` di CSS gak ketiban/ketimpa inline style (inline style attribute punya specificity lebih tinggi dari class biasa).

## Verifikasi
- Hari dengan checklist ≥15 gerakan tampil sebagai kotak dengan gradient oranye-merah-kuning yang bergerak diagonal dari kanan bawah ke kiri atas, dengan glow tipis yang pulsing pelan.
- Kotak dengan count 0-14 tetap memakai warna solid seperti sebelumnya, tidak berubah.
- Tooltip, legend, dan elemen lain di luar kotak **tidak berubah** — hanya visual kotak itu sendiri yang beda untuk hari dengan 15+ gerakan.
- Kalau OS/browser user diset `prefers-reduced-motion: reduce`, kotak blaze tetap kelihatan beda (gradient statis di posisi tengah) tapi tidak ada animasi gerak maupun glow pulsing.