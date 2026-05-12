// components/layout/MobileTopbar.tsx
"use client";

import { Flame, ChevronDown, User, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo-trans.png";

interface MobileTopbarProps {
  initials: string;
  handleSignOut: () => void;
}

export function MobileTopbar({ initials, handleSignOut }: MobileTopbarProps) {
  return (
    <header className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between px-4 backdrop-blur"
      style={{ background: "rgba(246,244,241,0.92)", borderBottom: "1.5px solid rgba(0,0,0,0.07)" }}>
      
      <div className="flex items-center gap-2">
        <Image src={logo} alt="DailyFit Logo" className="h-12 w-auto" />
        <span className="font-display text-lg text-[#0F0A0B]">DailyFit</span>
      </div>

      <div className="relative group">
        <button className="flex items-center gap-1.5 rounded-xl px-2 py-1.5" style={{ background: "rgba(0,0,0,0.04)" }}>
          <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#C41230" }}>
            {initials}
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>

        <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all">
          <Link href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
            <User className="h-4 w-4 text-gray-500" />
            My Profile
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}