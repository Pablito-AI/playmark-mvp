"use client";

import { useState } from "react";
import { deleteMarketAdminAction } from "@/app/actions";

type Props = {
  marketId: string;
  title: string;
};

export function AdminDeleteMarketButton({ marketId, title }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="border border-rose-300 bg-white text-rose-700 hover:bg-rose-50" onClick={() => setOpen(true)}>
        Eliminar predicción
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Confirmar eliminación</h3>
            <p className="mt-2 text-sm text-slate-600">
              Vas a eliminar la predicción <span className="font-semibold">{"\""}{title}{"\""}</span>.
            </p>
            <p className="mt-2 text-sm text-rose-700">Esta acción no devuelve puntos a los usuarios.</p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-100" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <form action={deleteMarketAdminAction}>
                <input type="hidden" name="market_id" value={marketId} />
                <button type="submit" className="bg-rose-600 text-white hover:bg-rose-700">
                  Eliminar predicción
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
