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
    .eq("status", "open");

  if (params.category) {
    marketsQuery = marketsQuery.eq("category", params.category);
  }

  const [{ data: marketsData }, { data: poolsData }, { data: categoriesData }] = await Promise.all([
    marketsQuery,
    supabase.from("market_pools").select("market_id, yes_pool, no_pool, total_pool, bet_count, participant_count"),
    supabase.from("markets").select("category").eq("status", "open")
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
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg md:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Trading dashboard</p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Mercados en vivo</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
          Probabilidades en tiempo real, pools y cuotas parimutuel con puntos virtuales.
        </p>
      </section>

      {params.success && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{params.success}</p>}
      {params.error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{params.error}</p>}

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/?filter=trending${params.category ? `&category=${encodeURIComponent(params.category)}` : ""}`}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${filter === "trending" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"}`}
          >
            Tendencia
          </Link>
          <Link
            href={`/?filter=new${params.category ? `&category=${encodeURIComponent(params.category)}` : ""}`}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${filter === "new" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"}`}
          >
            Nuevos
          </Link>
          <Link
            href="/"
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${!params.category ? "border-emerald-500 text-emerald-300" : "border-slate-700 text-slate-300"}`}
          >
            Todas
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/?filter=${filter}&category=${encodeURIComponent(category)}`}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${params.category === category ? "border-emerald-500 text-emerald-300" : "border-slate-700 text-slate-300"}`}
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((market) => (
          <MarketCard key={market.id} market={market} pool={pools.get(market.id)} />
        ))}
      </div>

      {!sorted.length && <p className="text-sm text-slate-300">Todavía no hay mercados disponibles.</p>}
    </div>
  );
}
