import { getAuthContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const sideMap: Record<string, string> = {
  yes: "SÍ",
  no: "NO"
};

const txTypeMap: Record<string, string> = {
  initial: "inicial",
  bet: "apuesta",
  payout: "pago",
  adjustment: "ajuste"
};

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
      <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="glass-panel p-4">
          <p className="text-xs text-slate-500">Puntos</p>
          <p className="text-xl font-semibold">{stats?.points ?? auth!.points}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-slate-500">Apuestas totales</p>
          <p className="text-xl font-semibold">{stats?.total_bets ?? 0}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-slate-500">Apuestas ganadas</p>
          <p className="text-xl font-semibold">{stats?.winning_bets ?? 0}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-slate-500">Precisión</p>
          <p className="text-xl font-semibold">{stats?.accuracy ?? 0}%</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel p-4">
          <h2 className="mb-3 text-lg font-semibold">Apuestas recientes</h2>
          <div className="space-y-2 text-sm">
            {(bets ?? []).map((bet) => (
              <div key={bet.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>
                  {sideMap[bet.side] ?? bet.side.toUpperCase()} - {bet.points} pts
                </span>
                <span className="text-xs text-slate-500">{new Date(bet.created_at).toLocaleString("es-ES")}</span>
              </div>
            ))}
            {!bets?.length && <p className="text-slate-500">Aún no tienes apuestas.</p>}
          </div>
        </div>

        <div className="glass-panel p-4">
          <h2 className="mb-3 text-lg font-semibold">Transacciones recientes</h2>
          <div className="space-y-2 text-sm">
            {(txs ?? []).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>
                  {txTypeMap[tx.type] ?? tx.type}: {tx.amount > 0 ? `+${tx.amount}` : tx.amount} pts
                </span>
                <span className="text-xs text-slate-500">Saldo {tx.balance_after}</span>
              </div>
            ))}
            {!txs?.length && <p className="text-slate-500">Aún no tienes transacciones.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
