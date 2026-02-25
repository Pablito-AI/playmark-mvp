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
  adjustment: "ajuste",
  refund: "refund"
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
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-4xl font-bold tracking-tight text-white">Perfil</h1>
        <p className="mt-1 text-sm text-slate-300">Resumen de rendimiento y actividad reciente.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Puntos</p>
          <p className="text-3xl font-bold text-slate-900">{stats?.points ?? auth!.points}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Apuestas totales</p>
          <p className="text-3xl font-bold text-slate-900">{stats?.total_bets ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Apuestas ganadas</p>
          <p className="text-3xl font-bold text-slate-900">{stats?.winning_bets ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Precisión</p>
          <p className="text-3xl font-bold text-slate-900">{stats?.accuracy ?? 0}%</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Apuestas recientes</h2>
          <div className="space-y-2 text-sm">
            {(bets ?? []).map((bet) => (
              <div key={bet.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span>
                  {sideMap[bet.side] ?? bet.side.toUpperCase()} - {bet.points} pts
                </span>
                <span className="text-xs text-slate-500">{new Date(bet.created_at).toLocaleString("es-ES")}</span>
              </div>
            ))}
            {!bets?.length && <p className="text-slate-500">Aún no tienes apuestas.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Transacciones recientes</h2>
          <div className="space-y-2 text-sm">
            {(txs ?? []).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
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
