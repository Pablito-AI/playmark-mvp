import Link from "next/link";
import { signUpAction } from "@/app/actions";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="mb-1 text-2xl font-semibold">Sign up</h1>
      <p className="mb-6 text-sm text-slate-600">Start with 100 points and make predictions.</p>

      {params.error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{params.error}</p>}

      <form action={signUpAction} className="space-y-4">
        <div>
          <label htmlFor="display_name">Display name</label>
          <input id="display_name" name="display_name" type="text" required />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength={6} required />
        </div>
        <button type="submit" className="w-full bg-brand-600 text-white hover:bg-brand-700">
          Create account
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already registered? <Link href="/login" className="font-medium text-brand-700">Log in</Link>
      </p>
    </div>
  );
}
