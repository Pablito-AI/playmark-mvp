import Link from "next/link";
import { AuthContext } from "@/lib/auth";
import { signOutAction } from "@/app/actions";

type Props = {
  user: AuthContext | null;
  isAdmin: boolean;
};

export function NavBar({ user, isAdmin }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            Play<span className="text-emerald-400">Market</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-slate-300 md:flex">
            <Link href="/" className="transition hover:text-white">
              Inicio
            </Link>
            <Link href="/leaderboard" className="transition hover:text-white">
              Ranking
            </Link>
            <Link href="/past" className="transition hover:text-white">
              Pasadas
            </Link>
            {user && (
              <Link href="/create" className="transition hover:text-white">
                Crear mercado
              </Link>
            )}
            {user && (
              <Link href="/profile" className="transition hover:text-white">
                Perfil
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="transition hover:text-white">
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                {user.points} pts
              </div>
              <form action={signOutAction}>
                <button type="submit" className="border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600 hover:bg-slate-800">
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white">
                Entrar
              </Link>
              <Link href="/signup" className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
