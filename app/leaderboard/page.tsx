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
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Ranking</h1>
      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100/80 text-slate-600">
            <tr>
              <th className="px-4 py-3">Posición</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className="border-t border-slate-200/80">
                <td className="px-4 py-3">#{idx + 1}</td>
                <td className="px-4 py-3">{row.display_name || row.email}</td>
                <td className="px-4 py-3 font-semibold">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
