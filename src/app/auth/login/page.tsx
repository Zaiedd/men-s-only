import { AuthForm } from "@/components/AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ return?: string }>;
}) {
  const { return: returnPath } = await searchParams;
  return (
    <div className="page container" style={{ display: "grid", placeItems: "start center", paddingTop: "clamp(40px,10vh,110px)" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <AuthForm mode="login" returnPath={returnPath} />
      </div>
    </div>
  );
}