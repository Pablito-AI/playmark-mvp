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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Panel de trading</p>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Ejecutar orden</h2>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Saldo</p>
          <p className="text-2xl font-bold text-slate-900">{availableBalance}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-900 px-3 py-2 text-white">
          <p className="text-[11px] uppercase tracking-wide text-slate-300">Odds SÍ</p>
          <p className="text-2xl font-bold">{formatOdds(yesOdds)}</p>
        </div>
        <div className="rounded-lg bg-slate-900 px-3 py-2 text-white">
          <p className="text-[11px] uppercase tracking-wide text-slate-300">Odds NO</p>
          <p className="text-2xl font-bold">{formatOdds(noOdds)}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
          <p className="font-semibold">Pool SÍ</p>
          <p className="text-base font-bold">{yesPool}</p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
          <p className="font-semibold">Pool NO</p>
          <p className="text-base font-bold">{noPool}</p>
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
              Ejecutar apuesta
            </button>
          </div>

          <div className="md:col-span-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Payout potencial</p>
            <p className="text-2xl font-bold text-slate-900">{potentialPayout === null ? "--" : `${Math.round(potentialPayout)} pts`}</p>
            <p className="text-xs text-slate-500">Estimado con odds actuales</p>
          </div>
        </form>
      ) : (
        <p className="text-sm text-slate-600">Este mercado ya no acepta apuestas.</p>
      )}
    </div>
  );
}
