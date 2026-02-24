import { MarketCard } from "@/components/market-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MarketPoolRow, MarketRow } from "@/types/app";

export default async function PastPredictionsPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: marketsData }, { data: poolsData }] = await Promise.all([
    supabase
      .from("markets")
      .select("id, creator_id, title, description, category, source_link, close_date, status, resolved_outcome, created_at")
      .in("status", ["closed", "resolved"])
      .order("close_date", { ascending: false }),
    supabase.from("market_pools").select("market_id, yes_pool, no_pool, total_pool, bet_count, participant_count")
  ]);

  const markets = (marketsData ?? []) as MarketRow[];
  const pools = new Map<string, MarketPoolRow>((poolsData ?? []).map((p) => [p.market_id, p]));

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Histórico</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Predicciones pasadas</h1>
        <p className="mt-2 text-sm text-slate-600 md:text-base">Mercados cerrados o ya resueltos.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {markets.map((market) => (
          <MarketCard key={market.id} market={market} pool={pools.get(market.id)} />
        ))}
      </div>

      {!markets.length && <p className="text-sm text-slate-600">Todavía no hay predicciones pasadas.</p>}
    </div>
  );
}
