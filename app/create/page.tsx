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
    <div className="mx-auto max-w-2xl glass-panel p-7">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Crear mercado</h1>
      <p className="mb-6 text-sm text-slate-600">Define una condición clara y verificable para resolver el resultado.</p>

      {params.error && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{params.error}</p>}

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

        <button type="submit" className="bg-brand-600 text-white hover:bg-brand-700">
          Publicar mercado
        </button>
      </form>
    </div>
  );
}
