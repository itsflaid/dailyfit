"use client";

import { useSession } from "next-auth/react";
import { WorkoutTimer } from "@/components/layout/WorkoutTimer";

export default function TimerPage() {
  const { data: session } = useSession();
  const userKey = session?.user?.email ?? session?.user?.name ?? "guest";

  return <WorkoutTimer userKey={userKey} />;
}
