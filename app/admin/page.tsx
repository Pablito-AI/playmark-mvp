import { resolveMarketAction } from "@/app/actions";
import { getAuthContext, isAdminEmail } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminDeleteMarketButton } from "@/components/admin-delete-market-button";

const statusMap: Record<string, string> = {
  open: "Abierto",
  closed: "Cerrado"
};

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const auth = await getAuthContext(true);
  const params = await searchParams;

  if (!isAdminEmail(auth!.email)) {
    return <p className="text-sm text-rose-300">No autorizado. Añade tu correo en ADMIN_EMAILS.</p>;
  }

  const supabase = await createSupabaseServerClient();
  const { data: markets } = await supabase
    .from("markets")
    .select("id, title, close_date, status")
    .in("status", ["closed", "open"])
    .order("close_date", { ascending: true });

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-4xl font-bold tracking-tight text-white">Panel admin</h1>
        <p className="mt-1 text-sm text-slate-300">Resolución y control de mercados desde web.</p>
      </div>

      {params.success && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{params.success}</p>}
      {params.error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{params.error}</p>}

      <div className="space-y-3">
        {(markets ?? []).map((market) => (
          <div key={market.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{market.title}</h2>
                <p className="text-xs text-slate-500">
                  Estado: {statusMap[market.status] ?? market.status} | Cierre: {new Date(market.close_date).toLocaleString("es-ES")}
                </p>
              </div>
              <AdminDeleteMarketButton marketId={market.id} title={market.title} />
            </div>

            <form action={resolveMarketAction} className="grid gap-3 md:grid-cols-4">
              <input type="hidden" name="market_id" value={market.id} />
              <div>
                <label htmlFor={`outcome-${market.id}`}>Resultado</label>
                <select id={`outcome-${market.id}`} name="outcome" defaultValue="yes">
                  <option value="yes">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor={`notes-${market.id}`}>Notas</label>
                <input id={`notes-${market.id}`} name="notes" placeholder="Evidencia opcional" />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-emerald-600 text-white hover:bg-emerald-500">
                  Resolver
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
