"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #C41230 0%, #7f1d1d 100%)" }}
    >
      {/* decorative shapes */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{ width: 260, height: 260, border: "48px solid rgba(255,255,255,0.06)", right: -60, top: -60 }}
      />
      <div
        className="absolute pointer-events-none rounded-full"
        style={{ width: 140, height: 140, border: "30px solid rgba(255,255,255,0.04)", left: -30, bottom: -40 }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ width: 180, height: 180, borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%", border: "36px solid rgba(255,255,255,0.05)", right: "15%", bottom: "10%" }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ width: 100, height: 100, borderRadius: "50% 50% 50% 50% / 60% 40% 60% 40%", border: "20px solid rgba(255,255,255,0.04)", left: "10%", top: "15%" }}
      />

      {/* card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative bg-white rounded-2xl px-8 py-10 text-center shadow-xl"
        style={{ maxWidth: 360, width: "90%", border: "1.5px solid rgba(0,0,0,0.06)" }}
      >
        {/* 404 */}
        <h1
          className="font-display leading-none tracking-tight"
          style={{ fontSize: 72, color: "#C41230", lineHeight: 1 }}
        >
          404
        </h1>

        {/* divider */}
        <div className="mx-auto my-4" style={{ width: 40, height: 3, borderRadius: 2, background: "linear-gradient(90deg, #C41230, #9B0E25)" }} />

        {/* title */}
        <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Mungkin halaman ini sudah dipindahkan atau URL-nya salah.
        </p>

        {/* primary button */}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #C41230 0%, #9B0E25 100%)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
      </motion.div>
    </div>
  );
}
