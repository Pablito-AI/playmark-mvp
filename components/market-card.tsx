import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { MarketRow, MarketPoolRow } from "@/types/app";

type Props = {
  market: MarketRow;
  pool?: MarketPoolRow;
};

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

export function MarketCard({ market, pool }: Props) {
  const total = pool?.total_pool ?? 0;
  const yes = pool?.yes_pool ?? 0;
  const no = pool?.no_pool ?? 0;
  const yesPct = total > 0 ? Math.round((yes / total) * 100) : 50;
  const noPct = 100 - yesPct;
  const yesOdds = calcOdds(total, yes);
  const noOdds = calcOdds(total, no);

  return (
    <Link
      href={`/markets/${market.id}`}
      className="block rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-20px_rgba(2,6,23,0.8)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_16px_38px_-18px_rgba(16,185,129,0.35)]"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="text-xl font-bold leading-tight tracking-tight text-slate-900">{market.title}</h3>
        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{market.category}</span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Pool SÍ</p>
          <p className="text-lg font-bold text-emerald-800">{yes}</p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50/80 p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">Pool NO</p>
          <p className="text-lg font-bold text-rose-800">{no}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-slate-900 px-3 py-2.5 text-white">
          <p className="text-[11px] uppercase tracking-wide text-slate-300">Odds SÍ</p>
          <p className="text-2xl font-bold leading-none">{yesOdds}</p>
        </div>
        <div className="rounded-lg bg-slate-900 px-3 py-2.5 text-white">
          <p className="text-[11px] uppercase tracking-wide text-slate-300">Odds NO</p>
          <p className="text-2xl font-bold leading-none">{noOdds}</p>
        </div>
      </div>

      <div className="mb-2 flex h-4 overflow-hidden rounded-md bg-slate-200">
        <div className="h-full bg-emerald-500" style={{ width: `${yesPct}%` }} />
        <div className="h-full bg-rose-500" style={{ width: `${noPct}%` }} />
      </div>

      <div className="mb-3 flex items-center justify-between text-xs font-semibold">
        <span className="text-emerald-700">SÍ {yesPct}%</span>
        <span className="text-rose-700">NO {noPct}%</span>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
        <span>Estado: {statusMap[market.status]}</span>
        <span>Cierra {formatDistanceToNowStrict(new Date(market.close_date), { addSuffix: true, locale: es })}</span>
      </div>
    </Link>
  );
}
