import Link from "next/link";
import { AuthContext } from "@/lib/auth";
import { signOutAction } from "@/app/actions";

type Props = {
  user: AuthContext | null;
  isAdmin: boolean;
};

export function NavBar({ user, isAdmin }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-brand-700">
            PlayMarket
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
            <Link href="/" className="hover:text-brand-700">
              Inicio
            </Link>
            <Link href="/leaderboard" className="hover:text-brand-700">
              Ranking
            </Link>
            <Link href="/past" className="hover:text-brand-700">
              Pasadas
            </Link>
            {user && (
              <Link href="/create" className="hover:text-brand-700">
                Crear mercado
              </Link>
            )}
            {user && (
              <Link href="/profile" className="hover:text-brand-700">
                Perfil
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="hover:text-brand-700">
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
                {user.points} pts
              </div>
              <form action={signOutAction}>
                <button type="submit" className="border border-slate-300 bg-white hover:bg-slate-100">
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-brand-700">
                Entrar
              </Link>
              <Link href="/signup" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
