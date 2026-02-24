import Link from "next/link";
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
      <section className="glass-panel overflow-hidden p-6 md:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Mercado de predicción</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Predice eventos. Compite con puntos.</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
          Opera mercados de sí/no con dinero ficticio y escala en el ranking.
        </p>
      </section>

      {params.success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{params.success}</p>}
      {params.error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{params.error}</p>}

      <div className="glass-panel flex flex-wrap items-center gap-2 p-3">
        <Link
          href={`/?filter=trending${params.category ? `&category=${encodeURIComponent(params.category)}` : ""}`}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${filter === "trending" ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
        >
          Tendencia
        </Link>
        <Link
          href={`/?filter=new${params.category ? `&category=${encodeURIComponent(params.category)}` : ""}`}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${filter === "new" ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
        >
          Nuevos
        </Link>
        <Link
          href="/"
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${!params.category ? "border-brand-600 text-brand-700" : "border-slate-300 text-slate-700"}`}
        >
          Todas
        </Link>
        {categories.map((category) => (
          <Link
            key={category}
            href={`/?filter=${filter}&category=${encodeURIComponent(category)}`}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${params.category === category ? "border-brand-600 text-brand-700" : "border-slate-300 text-slate-700"}`}
          >
            {category}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((market) => (
          <MarketCard key={market.id} market={market} pool={pools.get(market.id)} />
        ))}
      </div>

      {!sorted.length && <p className="text-sm text-slate-600">Todavía no hay mercados disponibles.</p>}
    </div>
  );
}
