"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { Flame } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { MobileTopbar } from "./MobileTopbar";
import { MobileBottomNav } from "./MobileBottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "U";

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-off">
        <div className="flex items-center gap-2 text-gray-500">
          <Flame className="h-5 w-5 animate-pulse" style={{ color: "#C41230" }} />
          <span>Memuat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-off">
      <Sidebar session={session} handleSignOut={handleSignOut} />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopbar initials={initials} handleSignOut={handleSignOut} />

        <main className="flex-1 pb-28 md:pb-0">
          <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
            {children}
          </div>
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}