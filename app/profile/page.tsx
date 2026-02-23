import { getAuthContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const auth = await getAuthContext(true);
  const supabase = await createSupabaseServerClient();

  const [{ data: stats }, { data: bets }, { data: txs }] = await Promise.all([
    supabase
      .from("user_stats")
      .select("points, total_bets, points_staked, winning_bets, accuracy")
      .eq("user_id", auth!.authUserId)
      .single(),
    supabase
      .from("bets")
      .select("id, market_id, side, points, created_at")
      .eq("user_id", auth!.authUserId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("transactions")
      .select("id, type, amount, balance_after, description, created_at")
      .eq("user_id", auth!.authUserId)
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Points</p>
          <p className="text-xl font-semibold">{stats?.points ?? auth!.points}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total Bets</p>
          <p className="text-xl font-semibold">{stats?.total_bets ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Winning Bets</p>
          <p className="text-xl font-semibold">{stats?.winning_bets ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Accuracy</p>
          <p className="text-xl font-semibold">{stats?.accuracy ?? 0}%</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Recent Bets</h2>
          <div className="space-y-2 text-sm">
            {(bets ?? []).map((bet) => (
              <div key={bet.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>
                  {bet.side.toUpperCase()} - {bet.points} pts
                </span>
                <span className="text-xs text-slate-500">{new Date(bet.created_at).toLocaleString()}</span>
              </div>
            ))}
            {!bets?.length && <p className="text-slate-500">No bets yet.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Recent Transactions</h2>
          <div className="space-y-2 text-sm">
            {(txs ?? []).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>
                  {tx.type}: {tx.amount > 0 ? `+${tx.amount}` : tx.amount} pts
                </span>
                <span className="text-xs text-slate-500">Bal {tx.balance_after}</span>
              </div>
            ))}
            {!txs?.length && <p className="text-slate-500">No transactions yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
