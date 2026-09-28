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

Copy `.env.example` ke `.env.local` dan isi:

```env
DATABASE_URL="postgresql://user:password@ep-xxxx.neon.tech/dbname?sslmode=require"
AUTH_SECRET="generate-dengan-openssl-rand-base64-32"
```

Generate `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Database

```bash
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations
```

### 4. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Fitur

- ✅ Auth (Register + Login)
- ✅ Exercise Library (CRUD, reps/time-based, muscle group)
- ✅ Plans (buat rencana dari exercise library)
- ✅ Daily Checklist (load plan / manual, gabung tanpa hapus)
- ✅ Statistics (streak, weekly chart, top 3, kategori)
- ✅ Profile (edit nama)
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
