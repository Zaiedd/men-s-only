"use client";

import { useEffect } from "react";
import { pingDailyAction } from "@/actions/user";

export function DailyHeartbeat({ hasSession }: { hasSession: boolean }) {
  useEffect(() => {
    if (!hasSession) return;
    pingDailyAction().catch(() => {});
    const id = window.setInterval(() => {
      pingDailyAction().catch(() => {});
    }, 4 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [hasSession]);

  return null;
}