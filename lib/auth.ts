import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthContext = {
  authUserId: string;
  email: string;
  points: number;
  displayName: string | null;
};

export async function getAuthContext(required = false): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    if (required) {
      redirect("/login");
    }
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("points, display_name")
    .eq("id", userData.user.id)
    .single();

  return {
    authUserId: userData.user.id,
    email: userData.user.email ?? "",
    points: profile?.points ?? 0,
    displayName: profile?.display_name ?? null
  };
}

export function isAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const list = raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  return list.includes(email.toLowerCase());
}
