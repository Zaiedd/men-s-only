"use server";

import { cookies } from "next/headers";

export async function markEntered() {
  const store = await cookies();
  store.set("mos_entered", "1", {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}