import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { MarketRow, MarketPoolRow } from "@/types/app";

type Props = {
  market: MarketRow;
  pool?: MarketPoolRow;
};

export function MarketCard({ market, pool }: Props) {
  const total = pool?.total_pool ?? 0;
  const yes = pool?.yes_pool ?? 0;
  const no = pool?.no_pool ?? 0;
  const yesPct = total > 0 ? Math.round((yes / total) * 100) : 50;
  const noPct = 100 - yesPct;

  return (
    <Link href={`/markets/${market.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-300">
      <div className="mb-2 flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-900">{market.title}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{market.category}</span>
      </div>

      <p className="mb-4 line-clamp-2 text-sm text-slate-600">{market.description}</p>

      <div className="mb-3 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
          YES {yesPct}% ({yes} pts)
        </div>
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">
          NO {noPct}% ({no} pts)
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Status: {market.status}</span>
        <span>Closes {formatDistanceToNowStrict(new Date(market.close_date), { addSuffix: true })}</span>
      </div>
    </Link>
  );
}
