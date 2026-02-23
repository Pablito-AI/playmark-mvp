import { resolveMarketAction } from "@/app/actions";
import { getAuthContext, isAdminEmail } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const auth = await getAuthContext(true);
  const params = await searchParams;

  if (!isAdminEmail(auth!.email)) {
    return <p className="text-sm text-rose-700">Unauthorized. Add your email to ADMIN_EMAILS.</p>;
  }

  const supabase = await createSupabaseServerClient();
  const { data: markets } = await supabase
    .from("markets")
    .select("id, title, close_date, status")
    .in("status", ["closed", "open"])
    .order("close_date", { ascending: true });

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
      <p className="text-sm text-slate-600">Resolve markets manually and trigger payouts.</p>

      {params.success && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{params.success}</p>}
      {params.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{params.error}</p>}

      <div className="space-y-3">
        {(markets ?? []).map((market) => (
          <div key={market.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">{market.title}</h2>
                <p className="text-xs text-slate-500">Status: {market.status} | Close: {new Date(market.close_date).toLocaleString()}</p>
              </div>
            </div>

            <form action={resolveMarketAction} className="grid gap-3 md:grid-cols-4">
              <input type="hidden" name="market_id" value={market.id} />
              <div>
                <label htmlFor={`outcome-${market.id}`}>Outcome</label>
                <select id={`outcome-${market.id}`} name="outcome" defaultValue="yes">
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor={`notes-${market.id}`}>Notes</label>
                <input id={`notes-${market.id}`} name="notes" placeholder="Optional evidence notes" />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-brand-600 text-white hover:bg-brand-700">
                  Resolve
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
