"use client";

import { Home, Dumbbell, CalendarCheck2, ListChecks, BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";
import logo from "@/assets/logo-trans.png";
import { motion } from "framer-motion";

interface SidebarProps {
  session: any;
  handleSignOut: () => void;
}

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/exercises", label: "Exercise", icon: Dumbbell },
  { to: "/today", label: "Today", icon: CalendarCheck2 },
  { to: "/plans", label: "Plans", icon: ListChecks },
  { to: "/stats", label: "Stats", icon: BarChart3 },
] as const;

export function Sidebar({ session, handleSignOut }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  const initials = session?.user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "U";

  const sidebarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = { 
    hidden: { opacity: 0, x: -20 }, 
    visible: { opacity: 1, x: 0 } 
  };

  return (
    <aside className="hidden md:flex md:w-72 lg:w-80 flex-col bg-white border-r border-gray-100 shadow-sm">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 px-8 border-b border-gray-100">
        <Image src={logo} alt="DailyFit Logo" className="h-12 w-auto" />
        <div>
          <div className="font-display text-2xl font-semibold tracking-tight text-gray-900">
            DailyFit
          </div>
          <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-medium -mt-1">
            Stay Strong
          </p>
        </div>
      </div>

      {/* Navigation */}
      <motion.nav 
        className="flex-1 px-4 py-8 space-y-1.5"
        initial="hidden" 
        animate="visible" 
        variants={sidebarVariants}
      >
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <motion.div key={item.to} variants={itemVariants}>
              <Link
                href={item.to}
                className={`group flex items-center gap-3.5 rounded-2xl px-5 py-3.5 text-sm font-medium transition-all duration-200 relative overflow-hidden
                  ${active 
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 ${active ? "" : "group-hover:scale-110"}`} />
                <span>{item.label}</span>

                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                )}
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>

      {/* Profile & Logout */}
      <div className="p-6 border-t border-gray-100 space-y-2">
        <Link
          href="/profile"
          className={`flex items-center gap-3.5 rounded-2xl px-5 py-3.5 transition-all duration-200 group
            ${isActive("/profile") 
              ? "bg-red-600 text-white" 
              : "hover:bg-gray-50 text-gray-700"
            }`}
        >
          <div
            className={`h-9 w-9 rounded-2xl flex items-center justify-center font-bold text-sm ring-2 transition-all
              ${isActive("/profile") 
                ? "bg-white/20 text-white ring-white/30" 
                : "bg-red-100 text-red-600 ring-red-200 group-hover:ring-red-300"
              }`}
          >
            {initials}
          </div>
          
          <div className="flex-1 truncate">
            <p className="font-medium text-sm">{session?.user?.name ?? "User"}</p>
            <p className="text-xs text-gray-400">Lihat Profile</p>
          </div>
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3.5 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group"
        >
          <LogOut className="h-5 w-5 transition-transform group-hover:rotate-12" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}