import Link from "next/link";
import { format } from "date-fns";
import { placeBetAction } from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth";
import { MarketPoolRow, MarketRow } from "@/types/app";

export default async function MarketDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const user = await getAuthContext();

  const [{ data: market }, { data: pool }] = await Promise.all([
    supabase
      .from("markets")
      .select("id, creator_id, title, description, category, source_link, close_date, status, resolved_outcome, created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("market_pools")
      .select("market_id, yes_pool, no_pool, total_pool, bet_count, participant_count")
      .eq("market_id", id)
      .single()
  ]);

  if (!market) {
    return <p className="text-sm text-slate-600">Market not found.</p>;
  }

  const m = market as MarketRow;
  const p = (pool ?? {
    market_id: id,
    yes_pool: 0,
    no_pool: 0,
    total_pool: 0,
    bet_count: 0,
    participant_count: 0
  }) as MarketPoolRow;

  const maxBet = user ? Math.max(1, Math.floor(user.points * 0.2)) : 0;

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm font-medium text-brand-700">
        ← Back to feed
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-1">{m.category}</span>
          <span>Status: {m.status}</span>
          <span>Closes {format(new Date(m.close_date), "PPpp")}</span>
          {m.resolved_outcome && <span>Resolved: {m.resolved_outcome.toUpperCase()}</span>}
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">{m.title}</h1>
        <p className="mt-2 text-sm text-slate-700">{m.description}</p>

        {m.source_link && (
          <a href={m.source_link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-brand-700">
            Source
          </a>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">YES pool: {p.yes_pool} pts</div>
          <div className="rounded-lg bg-rose-50 p-3 text-rose-700">NO pool: {p.no_pool} pts</div>
        </div>
        <p className="mt-2 text-xs text-slate-500">Total pool: {p.total_pool} pts</p>
      </div>

      {q.success && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{q.success}</p>}
      {q.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{q.error}</p>}

      {user ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 text-lg font-semibold">Place Bet</h2>
          <p className="mb-4 text-sm text-slate-600">
            Balance: {user.points} pts. Max per bet (20%): {maxBet} pts.
          </p>

          {m.status === "open" ? (
            <form action={placeBetAction} className="grid gap-4 md:grid-cols-3">
              <input type="hidden" name="market_id" value={m.id} />
              <div>
                <label htmlFor="side">Side</label>
                <select id="side" name="side" defaultValue="yes">
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label htmlFor="points">Points</label>
                <input id="points" name="points" type="number" min={1} max={maxBet} required />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-brand-600 text-white hover:bg-brand-700">
                  Place Bet
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-slate-600">Market is not open for betting.</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          <Link href="/login" className="font-medium text-brand-700">
            Log in
          </Link>{" "}
          to place bets.
        </div>
      )}
    </div>
  );
}
