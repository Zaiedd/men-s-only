import { cookies } from "next/headers";
import LandingHero from "@/components/LandingHero";

export const metadata = {
  title: "MEN'S ONLY — Build the Perfect Man",
};

export default async function LandingPage() {
  const store = await cookies();
  const showSplash = store.get("mos_entered")?.value !== "1";
  return <LandingHero showSplash={showSplash} />;
}