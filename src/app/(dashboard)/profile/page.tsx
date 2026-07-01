"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { User, LogOut, Save } from "lucide-react";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Nama wajib diisi");
    setSaving(true);

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setSaving(false);
    if (!res.ok) return toast.error("Gagal memperbarui profil");
    await update({ name });
    toast.success("Profil diperbarui!");
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-ink">Profil</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola informasi akun Anda.</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-xl font-black shadow-sm">
          {initials || <User className="h-8 w-8" />}
        </div>
        <div>
          <div className="font-bold text-ink text-lg">{session?.user?.name}</div>
          <div className="text-sm text-muted-foreground">{session?.user?.email}</div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-ink">Edit Profil</h2>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Nama</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama lengkap"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            value={session?.user?.email ?? ""}
            disabled
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-off text-muted-foreground cursor-not-allowed"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm space-y-3">
        <h2 className="font-bold text-ink">Keluar</h2>
        <p className="text-sm text-muted-foreground">Anda akan keluar dari semua perangkat.</p>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 border border-primary-600 text-primary-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-50 transition disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? "Keluar..." : "Keluar"}
        </button>
      </div>
    </div>
  );
}
