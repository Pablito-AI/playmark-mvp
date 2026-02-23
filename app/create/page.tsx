import { createMarketAction } from "@/app/actions";
import { getAuthContext } from "@/lib/auth";

export default async function CreateMarketPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await getAuthContext(true);
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="mb-1 text-2xl font-semibold">Create Market</h1>
      <p className="mb-6 text-sm text-slate-600">Create a yes/no prediction market with a clear resolution condition.</p>

      {params.error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{params.error}</p>}

      <form action={createMarketAction} className="space-y-4">
        <div>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" required maxLength={180} />
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" required rows={4} />
        </div>
        <div>
          <label htmlFor="category">Category</label>
          <input id="category" name="category" type="text" required placeholder="Politics, Sports, Tech..." />
        </div>
        <div>
          <label htmlFor="source_link">Source link</label>
          <input id="source_link" name="source_link" type="url" placeholder="https://..." />
        </div>
        <div>
          <label htmlFor="close_date">Close date</label>
          <input id="close_date" name="close_date" type="datetime-local" required />
        </div>

        <button type="submit" className="bg-brand-600 text-white hover:bg-brand-700">
          Create
        </button>
      </form>
    </div>
  );
}
