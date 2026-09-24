import { SearchExplorer } from "@/components/SearchExplorer";
import { searchActionRaw } from "@/actions/browse";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const initial = await searchActionRaw(q);

  return (
    <div className="page container">
      <header className="page-head">
        <p className="eyebrow eyebrow--red">Find the standard</p>
        <h1>Search</h1>
        <p className="sub">
          Ask like you mean it. The search reads titles, tags, descriptions and
          the full body of every piece.
        </p>
      </header>
      <SearchExplorer initial={initial} />
    </div>
  );
}