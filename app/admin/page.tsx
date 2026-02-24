import { resolveMarketAction } from "@/app/actions";
import { getAuthContext, isAdminEmail } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    return <p className="text-sm text-rose-700">No autorizado. Añade tu correo en ADMIN_EMAILS.</p>;
  }

  const supabase = await createSupabaseServerClient();
  const { data: markets } = await supabase
    .from("markets")
    .select("id, title, close_date, status")
    .in("status", ["closed", "open"])
    .order("close_date", { ascending: true });

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold tracking-tight">Panel de administración</h1>
      <p className="text-sm text-slate-600">Resuelve mercados manualmente y dispara el pago automático.</p>

      {params.success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{params.success}</p>}
      {params.error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{params.error}</p>}

      <div className="space-y-3">
        {(markets ?? []).map((market) => (
          <div key={market.id} className="glass-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">{market.title}</h2>
                <p className="text-xs text-slate-500">
                  Estado: {statusMap[market.status] ?? market.status} | Cierre: {new Date(market.close_date).toLocaleString("es-ES")}
                </p>
              </div>
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
                <button type="submit" className="w-full bg-brand-600 text-white hover:bg-brand-700">
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
