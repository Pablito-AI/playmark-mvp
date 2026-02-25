import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { placeBetAction } from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth";
import { MarketPoolRow, MarketRow } from "@/types/app";
import { BetTradePanel } from "@/components/bet-trade-panel";

const statusMap: Record<MarketRow["status"], string> = {
  open: "Abierto",
  closed: "Cerrado",
  resolved: "Resuelto"
};

function calcOdds(totalPool: number, sidePool: number): string {
  if (totalPool <= 0 || sidePool <= 0) {
    return "--";
  }
  return `${(totalPool / sidePool).toFixed(2)}x`;
}

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

  const [{ data: market }, { data: pool }, { data: myBets }] = await Promise.all([
    supabase
      .from("markets")
      .select("id, creator_id, title, description, category, source_link, close_date, status, resolved_outcome, created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("market_pools")
      .select("market_id, yes_pool, no_pool, total_pool, bet_count, participant_count")
      .eq("market_id", id)
      .single(),
    user
      ? supabase
          .from("bets")
          .select("id, side, points, created_at")
          .eq("market_id", id)
          .eq("user_id", user.authUserId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] })
  ]);

  if (!market) {
    return <p className="text-sm text-slate-600">Mercado no encontrado.</p>;
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

  const availableBalance = user?.points ?? 0;
  const yesPct = p.total_pool > 0 ? Math.round((p.yes_pool / p.total_pool) * 100) : 50;
  const noPct = 100 - yesPct;
  const yesOdds = calcOdds(p.total_pool, p.yes_pool);
  const noOdds = calcOdds(p.total_pool, p.no_pool);

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
        ← Volver al inicio
      </Link>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-md bg-slate-800 px-2 py-1 font-semibold text-slate-200">{m.category}</span>
            <span className="text-slate-300">Estado: {statusMap[m.status]}</span>
            <span className="text-slate-300">Cierre: {format(new Date(m.close_date), "PPpp", { locale: es })}</span>
            {m.resolved_outcome && <span className="text-slate-300">Resultado: {m.resolved_outcome === "yes" ? "Sí" : "No"}</span>}
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Pool total</p>
            <p className="text-3xl font-bold leading-none text-white">{p.total_pool}</p>
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white">{m.title}</h1>
        <p className="mt-2 text-sm text-slate-300">{m.description}</p>

        {m.source_link && (
          <a href={m.source_link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-emerald-300">
            Ver fuente
          </a>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-200">
            <p className="text-[11px] uppercase tracking-wide text-emerald-300">SÍ</p>
            <p className="text-3xl font-bold leading-none">{yesPct}%</p>
            <p className="mt-1 text-sm text-emerald-100">Pool: {p.yes_pool} pts</p>
            <p className="text-sm font-semibold">Odds: {yesOdds}</p>
          </div>
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-rose-200">
            <p className="text-[11px] uppercase tracking-wide text-rose-300">NO</p>
            <p className="text-3xl font-bold leading-none">{noPct}%</p>
            <p className="mt-1 text-sm text-rose-100">Pool: {p.no_pool} pts</p>
            <p className="text-sm font-semibold">Odds: {noOdds}</p>
          </div>
        </div>

        <div className="mt-4 flex h-4 overflow-hidden rounded-md bg-slate-800">
          <div className="h-full bg-emerald-500" style={{ width: `${yesPct}%` }} />
          <div className="h-full bg-rose-500" style={{ width: `${noPct}%` }} />
        </div>
      </div>

      {q.success && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{q.success}</p>}
      {q.error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{q.error}</p>}

      {user ? (
        <>
          <BetTradePanel
            action={placeBetAction}
            marketId={m.id}
            marketStatus={m.status}
            availableBalance={availableBalance}
            yesPool={p.yes_pool}
            noPool={p.no_pool}
            totalPool={p.total_pool}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Tus apuestas en este mercado</h2>
            <div className="space-y-2">
              {(myBets ?? []).map((bet) => (
                <div key={bet.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                  <div className="text-slate-700">
                    <span className="font-semibold">{bet.side === "yes" ? "SÍ" : "NO"}</span> - {bet.points} pts
                    <span className="ml-2 text-xs text-slate-500">{new Date(bet.created_at).toLocaleString("es-ES")}</span>
                  </div>
                  <span className="text-xs text-slate-500">Apuesta final</span>
                </div>
              ))}
              {!myBets?.length && <p className="text-sm text-slate-500">Aún no has apostado en este mercado.</p>}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          <Link href="/login" className="font-semibold text-brand-700">
            Inicia sesión
          </Link>{" "}
          para apostar.
        </div>
      )}
    </div>
  );
}
