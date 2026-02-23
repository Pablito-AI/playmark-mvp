import Link from "next/link";
import { AuthContext } from "@/lib/auth";
import { signOutAction } from "@/app/actions";

type Props = {
  user: AuthContext | null;
  isAdmin: boolean;
};

export function NavBar({ user, isAdmin }: Props) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-brand-700">
            PlayMarket
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <Link href="/">Feed</Link>
            <Link href="/leaderboard">Leaderboard</Link>
            {user && <Link href="/create">Create Market</Link>}
            {user && <Link href="/profile">Profile</Link>}
            {isAdmin && <Link href="/admin">Admin</Link>}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {user.points} pts
              </div>
              <form action={signOutAction}>
                <button type="submit" className="border border-slate-300 bg-white hover:bg-slate-100">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-700">
                Log in
              </Link>
              <Link href="/signup" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
