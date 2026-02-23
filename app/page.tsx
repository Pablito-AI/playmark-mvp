import { MarketCard } from "@/components/market-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MarketPoolRow, MarketRow } from "@/types/app";

type FeedFilter = "trending" | "new";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ filter?: FeedFilter; category?: string; success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const filter = params.filter === "new" ? "new" : "trending";

  let marketsQuery = supabase
    .from("markets")
    .select("id, creator_id, title, description, category, source_link, close_date, status, resolved_outcome, created_at")
    .neq("status", "resolved");

  if (params.category) {
    marketsQuery = marketsQuery.eq("category", params.category);
  }

  const [{ data: marketsData }, { data: poolsData }, { data: categoriesData }] = await Promise.all([
    marketsQuery,
    supabase.from("market_pools").select("market_id, yes_pool, no_pool, total_pool, bet_count, participant_count"),
    supabase.from("markets").select("category")
  ]);

  const markets = (marketsData ?? []) as MarketRow[];
  const pools = new Map<string, MarketPoolRow>((poolsData ?? []).map((p) => [p.market_id, p]));

  const sorted = [...markets].sort((a, b) => {
    if (filter === "new") {
      return new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf();
    }

    return (pools.get(b.id)?.total_pool ?? 0) - (pools.get(a.id)?.total_pool ?? 0);
  });

  const categories = [...new Set((categoriesData ?? []).map((x) => x.category))].sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Prediction Feed</h1>
        <p className="mt-1 text-sm text-slate-600">Trade play-money points on yes/no outcomes.</p>
      </div>

      {params.success && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{params.success}</p>}
      {params.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{params.error}</p>}

      <div className="flex flex-wrap gap-2">
        <a href={`/?filter=trending${params.category ? `&category=${encodeURIComponent(params.category)}` : ""}`} className={`rounded-lg px-3 py-2 text-sm ${filter === "trending" ? "bg-brand-600 text-white" : "bg-white text-slate-700 border border-slate-300"}`}>
          Trending
        </a>
        <a href={`/?filter=new${params.category ? `&category=${encodeURIComponent(params.category)}` : ""}`} className={`rounded-lg px-3 py-2 text-sm ${filter === "new" ? "bg-brand-600 text-white" : "bg-white text-slate-700 border border-slate-300"}`}>
          New
        </a>
        <a href="/" className={`rounded-lg border px-3 py-2 text-sm ${!params.category ? "border-brand-600 text-brand-700" : "border-slate-300 text-slate-700"}`}>
          All categories
        </a>
        {categories.map((category) => (
          <a
            key={category}
            href={`/?filter=${filter}&category=${encodeURIComponent(category)}`}
            className={`rounded-lg border px-3 py-2 text-sm ${params.category === category ? "border-brand-600 text-brand-700" : "border-slate-300 text-slate-700"}`}
          >
            {category}
          </a>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((market) => (
          <MarketCard key={market.id} market={market} pool={pools.get(market.id)} />
        ))}
      </div>

      {!sorted.length && <p className="text-sm text-slate-600">No markets available yet.</p>}
    </div>
  );
}
