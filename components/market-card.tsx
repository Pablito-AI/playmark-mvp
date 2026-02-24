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

export function MarketCard({ market, pool }: Props) {
  const total = pool?.total_pool ?? 0;
  const yes = pool?.yes_pool ?? 0;
  const no = pool?.no_pool ?? 0;
  const yesPct = total > 0 ? Math.round((yes / total) * 100) : 50;
  const noPct = 100 - yesPct;

  return (
    <Link
      href={`/markets/${market.id}`}
      className="glass-panel block p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold leading-snug text-slate-900">{market.title}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {market.category}
        </span>
      </div>

      <p className="mb-4 line-clamp-2 text-sm text-slate-600">{market.description}</p>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-emerald-500" style={{ width: `${yesPct}%` }} />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-emerald-50 px-3 py-2 font-medium text-emerald-700">SÍ {yesPct}% ({yes} pts)</div>
        <div className="rounded-lg bg-rose-50 px-3 py-2 font-medium text-rose-700">NO {noPct}% ({no} pts)</div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Estado: {statusMap[market.status]}</span>
        <span>Cierra {formatDistanceToNowStrict(new Date(market.close_date), { addSuffix: true, locale: es })}</span>
      </div>
    </Link>
  );
}
