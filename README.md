# DailyFit 🔥

Tracker workout harian pribadi — Next.js 15, Prisma v6, NextAuth v5, Supabase PostgreSQL.

## Tech Stack

- **Frontend + API**: Next.js 15 App Router
- **Auth**: NextAuth v5 (Credentials)
- **ORM**: Prisma v6
- **Database**: Supabase PostgreSQL
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
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET="generate-dengan-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

Generate `NEXTAUTH_SECRET`:
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


<p align="center">
  <a href="https://flaid.my.id"> By Flaid</a>
</p>
