# DailyFit 🔥

Tracker workout harian pribadi — Next.js 16, Prisma v6, NextAuth v5, Neon PostgreSQL.

## Tech Stack

- **Frontend + API**: Next.js 16 App Router
- **Auth**: NextAuth v5 (Credentials)
- **ORM**: Prisma v6
- **Database**: Neon PostgreSQL
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Notifications**: Sonner

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` ke `.env` dan isi (Prisma CLI hanya membaca `.env`):

```env
DATABASE_URL="postgresql://user:password@ep-xxxx.neon.tech/dbname?sslmode=require"
AUTH_SECRET="generate-dengan-openssl-rand-base64-32"
```

Generate `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Database

Database baru (kosong):

```bash
npm run db:deploy     # Jalankan semua migrasi
```

Database lama yang dulu dibuat dengan `db:push` cukup menandai migrasi awal sekali, lalu menjalankan sisanya:

```bash
npx prisma migrate resolve --applied 20261101000000_init
npm run db:deploy
```

Untuk Neon, jalankan migrasi dengan connection string *direct* (host tanpa `-pooler`). Prisma client dibuat otomatis saat `npm install`.

Perubahan schema berikutnya: `npm run db:migrate` di database development, commit folder `prisma/migrations`, lalu `npm run db:deploy` ke production **sebelum** kode barunya di-deploy.

### 4. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 5. Pemeriksaan

```bash
npm run lint
npm run typecheck
npm test
```

## Akun & keamanan

- Ganti kata sandi dari halaman Profil. Kata sandi lama wajib diisi dan sesi di perangkat lain ikut keluar (paling lambat 30 detik).
- Lupa kata sandi (belum ada reset lewat email), jalankan di mesin yang punya akses database:

  ```bash
  npm run user:reset-password -- email@contoh.com
  ```

- Batas percobaan: login 5x per akun dari satu IP dan 30x per IP tiap 15 menit, daftar 5x per IP tiap jam, ganti kata sandi 5x tiap 15 menit.
- Alamat IP dibaca dari `x-forwarded-for`. Di server sendiri, pastikan reverse proxy menimpa header itu.

## Fitur

- ✅ Auth (Register + Login)
- ✅ Exercise Library (CRUD, reps/time-based, muscle group; menghapus latihan tidak menghapus riwayat)
- ✅ Plans (buat rencana dari exercise library)
- ✅ Daily Checklist (load plan / manual, gabung tanpa hapus)
- ✅ Statistics (streak, weekly chart, top 5, kategori, heatmap, log gerakan)
- ✅ Profile (edit nama, ganti kata sandi)
- ✅ Workout timer dengan preset dan alarm
- ✅ Laporan PDF mingguan dan bulanan
- ✅ Sidebar desktop + Bottom nav mobile (5 item)
- ✅ Profile di top bar mobile


---

<p align="center">
  <img src="https://img.shields.io/badge/Portfolio-flaid.my.id-black?style=flat-square" alt="Portfolio" />
  <a href="https://github.com/itsflaid"><img src="https://img.shields.io/badge/GitHub-itsflaid-black?style=flat-square&logo=github" alt="GitHub" /></a>
</p>

<p align="center">
  Built with ☕ by <a href="https://flaid.my.id"><strong>Flaid</strong></a> — Full-stack Developer & Indie Builder
</p>
