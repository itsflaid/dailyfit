"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.code === "rate_limited") {
      toast.error("Terlalu banyak percobaan. Coba lagi dalam 15 menit.");
    } else if (res?.error) {
      toast.error("Email atau password salah");
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <span className="block text-[0.72rem] font-semibold tracking-[2.5px] uppercase mb-5" style={{ color: "#C41230" }}>
        Selamat datang
      </span>
      <h2 className="font-display leading-[1.0] mb-2" style={{ fontSize: "clamp(2.2rem,4vw,3.2rem)", color: "#0F0A0B" }}>
        Sudah punya<br />akun?
      </h2>
      <p className="text-[0.875rem] leading-[1.65] mb-10" style={{ color: "#888", maxWidth: 300 }}>
        Masuk dan lanjutkan rutinitas kamu. Belum punya akun? Daftar gratis dalam hitungan detik.
      </p>

      <form onSubmit={handleLogin} className="space-y-3 w-full max-w-[300px]">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full px-4 py-[14px] rounded-[11px] text-[0.92rem] font-medium bg-white outline-none transition"
          style={{ border: "1.5px solid rgba(0,0,0,0.11)", color: "#0F0A0B" }}
          onFocus={(e) => (e.target.style.borderColor = "#C41230")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.11)")}
        />

        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-4 py-[14px] pr-11 rounded-[11px] text-[0.92rem] font-medium bg-white outline-none transition"
            style={{ border: "1.5px solid rgba(0,0,0,0.11)", color: "#0F0A0B" }}
            onFocus={(e) => (e.target.style.borderColor = "#C41230")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.11)")}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "#bbb" }}
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-between px-5 py-[15px] rounded-[11px] text-[0.92rem] font-semibold text-white transition-all disabled:opacity-60"
          style={{ background: "#C41230", boxShadow: "0 4px 18px rgba(196,18,48,0.22)" }}
        >
          <span>{loading ? "Memuat..." : "Masuk"}</span>
          <span className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] text-sm" style={{ background: "rgba(255,255,255,0.18)" }}>→</span>
        </button>
      </form>

      <div className="flex items-center gap-3 my-4 w-full max-w-[300px]">
        <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.09)" }} />
        <span className="text-[0.7rem] font-medium" style={{ color: "#c0c0c0" }}>atau</span>
        <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.09)" }} />
      </div>

      <Link
        href="/register"
        className="w-full max-w-[300px] flex items-center justify-between px-5 py-[15px] rounded-[11px] text-[0.92rem] font-semibold transition-all group"
        style={{ border: "1.5px solid rgba(0,0,0,0.11)", color: "#0F0A0B" }}
      >
        <span>Daftar gratis</span>
        <span className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] text-sm" style={{ background: "rgba(0,0,0,0.05)" }}>＋</span>
      </Link>
    </>
  );
}
