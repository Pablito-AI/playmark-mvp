import { createMarketAction } from "@/app/actions";
import { getAuthContext } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";

export default async function CreateMarketPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await getAuthContext(true);
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Crear mercado</h1>
        <p className="mt-1 text-sm text-slate-300">Configura una predicción con categoría fija y condición verificable.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
        {params.error && <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{params.error}</p>}

        <form action={createMarketAction} className="space-y-4">
          <div>
            <label htmlFor="title">Título</label>
            <input id="title" name="title" type="text" required maxLength={180} />
          </div>
          <div>
            <label htmlFor="description">Descripción</label>
            <textarea id="description" name="description" required rows={4} />
          </div>
          <div>
            <label htmlFor="category">Categoría</label>
            <select id="category" name="category" required defaultValue="">
              <option value="" disabled>
                Selecciona una categoría
              </option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="source_link">Enlace fuente</label>
            <input id="source_link" name="source_link" type="url" placeholder="https://..." />
          </div>
          <div>
            <label htmlFor="close_date">Fecha de cierre</label>
            <input id="close_date" name="close_date" type="datetime-local" required />
          </div>

          <button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-500">
            Publicar mercado
          </button>
        </form>
      </div>
    </div>
  );
}
