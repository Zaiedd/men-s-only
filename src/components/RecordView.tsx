"use client";

import { useEffect } from "react";
import { recordViewAction } from "@/actions/user";

export function RecordView({ contentId }: { contentId: string }) {
  useEffect(() => {
    const t = window.setTimeout(() => {
      recordViewAction(contentId).catch(() => {});
    }, 1500);
    return () => window.clearTimeout(t);
  }, [contentId]);

  return null;
}