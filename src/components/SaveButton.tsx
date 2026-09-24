"use client";

import { useState, useTransition } from "react";
import { saveToggleAction } from "@/actions/user";

export function SaveButton({
  contentId,
  initialSaved,
}: {
  contentId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();

  const toggle = () => {
    start(async () => {
      const r = await saveToggleAction(contentId);
      if (r.saved !== undefined) setSaved(Boolean(r.saved));
    });
  };

  return (
    <button
      type="button"
      className={`btn btn--sm ${saved ? "btn--ghost saved" : "btn--ghost"}`}
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}