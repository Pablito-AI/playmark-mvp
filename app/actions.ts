"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getAuthContext, isAdminEmail } from "@/lib/auth";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function toPositiveInt(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export async function signUpAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const displayName = getString(formData, "display_name");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName }
    }
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signInAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createMarketAction(formData: FormData) {
  const auth = await getAuthContext(true);
  const supabase = await createSupabaseServerClient();

  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const category = getString(formData, "category");
  const sourceLink = getString(formData, "source_link");
  const closeDate = getString(formData, "close_date");

  if (!title || !description || !category || !closeDate) {
    redirect("/create?error=All required fields must be filled.");
  }

  const closeDateObj = new Date(closeDate);
  if (Number.isNaN(closeDateObj.valueOf()) || closeDateObj <= new Date()) {
    redirect("/create?error=Close date must be in the future.");
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("markets")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", auth!.authUserId)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= 5) {
    redirect("/create?error=Rate limit reached. Try again later.");
  }

  const { error } = await supabase.from("markets").insert({
    creator_id: auth!.authUserId,
    title,
    description,
    category,
    source_link: sourceLink || null,
    close_date: closeDateObj.toISOString()
  });

  if (error) {
    redirect(`/create?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  redirect("/?success=Market created");
}

export async function placeBetAction(formData: FormData) {
  await getAuthContext(true);
  const supabase = await createSupabaseServerClient();

  const marketId = getString(formData, "market_id");
  const side = getString(formData, "side");
  const points = toPositiveInt(getString(formData, "points"));

  if (!marketId || !["yes", "no"].includes(side) || !Number.isFinite(points) || points <= 0) {
    redirect(`/markets/${marketId}?error=Invalid bet`);
  }

  const { error } = await supabase.rpc("place_bet", {
    p_market_id: marketId,
    p_side: side,
    p_points: points
  });

  if (error) {
    redirect(`/markets/${marketId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath(`/markets/${marketId}`);
  revalidatePath("/leaderboard");
  revalidatePath("/profile");
  redirect(`/markets/${marketId}?success=Bet placed`);
}

export async function resolveMarketAction(formData: FormData) {
  const auth = await getAuthContext(true);

  if (!isAdminEmail(auth!.email)) {
    redirect("/admin?error=Unauthorized");
  }

  const marketId = getString(formData, "market_id");
  const outcome = getString(formData, "outcome");
  const notes = getString(formData, "notes");

  if (!marketId || !["yes", "no"].includes(outcome)) {
    redirect("/admin?error=Invalid resolution payload");
  }

  const service = createSupabaseServiceClient();
  const { error } = await service.rpc("resolve_market", {
    p_market_id: marketId,
    p_outcome: outcome,
    p_resolver_id: auth!.authUserId,
    p_notes: notes || null
  });

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  redirect("/admin?success=Market resolved");
}
