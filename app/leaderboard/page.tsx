import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LeaderboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("users")
    .select("id, display_name, email, points")
    .order("points", { ascending: false })
    .limit(100);

  const rows = data ?? [];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-4xl font-bold tracking-tight text-white">Ranking</h1>
        <p className="mt-1 text-sm text-slate-300">Clasificación global por puntos.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Posición</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-semibold">#{idx + 1}</td>
                <td className="px-4 py-3">{row.display_name || row.email}</td>
                <td className="px-4 py-3 text-base font-bold text-slate-900">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
