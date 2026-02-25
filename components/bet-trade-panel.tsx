"use client";

import { useMemo, useState } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  marketId: string;
  marketStatus: "open" | "closed" | "resolved";
  availableBalance: number;
  yesPool: number;
  noPool: number;
  totalPool: number;
};

function odds(totalPool: number, sidePool: number): number | null {
  if (totalPool <= 0 || sidePool <= 0) {
    return null;
  }
  return totalPool / sidePool;
}

function formatOdds(value: number | null): string {
  if (value === null) {
    return "--";
  }
  return `${value.toFixed(2)}x`;
}

export function BetTradePanel({ action, marketId, marketStatus, availableBalance, yesPool, noPool, totalPool }: Props) {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [points, setPoints] = useState<string>("");

  const yesOdds = useMemo(() => odds(totalPool, yesPool), [totalPool, yesPool]);
  const noOdds = useMemo(() => odds(totalPool, noPool), [totalPool, noPool]);
  const selectedOdds = side === "yes" ? yesOdds : noOdds;

  const numericPoints = Number(points);
  const potentialPayout = Number.isFinite(numericPoints) && numericPoints > 0 && selectedOdds !== null ? numericPoints * selectedOdds : null;

  return (
    <div className="glass-panel p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Trading</h2>
        <p className="text-sm text-slate-600">Saldo: {availableBalance} pts</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-xs text-emerald-700">Odds SÍ</p>
          <p className="font-semibold text-emerald-800">{formatOdds(yesOdds)}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
          <p className="text-xs text-rose-700">Odds NO</p>
          <p className="font-semibold text-rose-800">{formatOdds(noOdds)}</p>
        </div>
      </div>

      <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
        Las apuestas son finales. No se pueden retirar puntos.
      </p>

      {marketStatus === "open" ? (
        <form action={action} className="grid gap-4 md:grid-cols-3">
          <input type="hidden" name="market_id" value={marketId} />
          <div>
            <label htmlFor="side">Lado</label>
            <select
              id="side"
              name="side"
              value={side}
              onChange={(e) => setSide(e.target.value as "yes" | "no")}
            >
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label htmlFor="points">Puntos</label>
            <input
              id="points"
              name="points"
              type="number"
              min={1}
              required
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-brand-600 text-white hover:bg-brand-700">
              Apostar
            </button>
          </div>

          <div className="md:col-span-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="font-medium">Payout potencial:</span>{" "}
            {potentialPayout === null ? "--" : `${Math.round(potentialPayout)} pts`}
            <span className="ml-2 text-xs text-slate-500">(estimado con odds actuales)</span>
          </div>
        </form>
      ) : (
        <p className="text-sm text-slate-600">Este mercado ya no acepta apuestas.</p>
      )}
    </div>
  );
}
