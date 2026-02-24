import Link from "next/link";
import { signUpAction } from "@/app/actions";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-md glass-panel p-7">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Crear cuenta</h1>
      <p className="mb-6 text-sm text-slate-600">Empieza con 100 puntos y entra al mercado.</p>

      {params.error && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{params.error}</p>}

      <form action={signUpAction} className="space-y-4">
        <div>
          <label htmlFor="display_name">Nombre visible</label>
          <input id="display_name" name="display_name" type="text" required />
        </div>
        <div>
          <label htmlFor="email">Correo</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div>
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" minLength={6} required />
        </div>
        <button type="submit" className="w-full bg-brand-600 text-white hover:bg-brand-700">
          Registrarme
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-brand-700">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
