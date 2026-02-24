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
    redirect("/create?error=Completa todos los campos obligatorios.");
  }

  const closeDateObj = new Date(closeDate);
  if (Number.isNaN(closeDateObj.valueOf()) || closeDateObj <= new Date()) {
    redirect("/create?error=La fecha de cierre debe estar en el futuro.");
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("markets")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", auth!.authUserId)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= 5) {
    redirect("/create?error=Límite alcanzado. Inténtalo de nuevo más tarde.");
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
  redirect("/?success=Mercado creado");
}

export async function placeBetAction(formData: FormData) {
  await getAuthContext(true);
  const supabase = await createSupabaseServerClient();

  const marketId = getString(formData, "market_id");
  const side = getString(formData, "side");
  const points = toPositiveInt(getString(formData, "points"));

  if (!marketId || !["yes", "no"].includes(side) || !Number.isFinite(points) || points <= 0) {
    redirect(`/markets/${marketId}?error=Apuesta inválida`);
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
  redirect(`/markets/${marketId}?success=Apuesta realizada`);
}

export async function cancelBetAction(formData: FormData) {
  await getAuthContext(true);
  const supabase = await createSupabaseServerClient();

  const marketId = getString(formData, "market_id");
  const betId = getString(formData, "bet_id");

  if (!marketId || !betId) {
    redirect(`/markets/${marketId}?error=Datos de cancelación inválidos`);
  }

  const { error } = await supabase.rpc("cancel_bet", {
    p_bet_id: betId
  });

  if (error) {
    redirect(`/markets/${marketId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath(`/markets/${marketId}`);
  revalidatePath("/leaderboard");
  revalidatePath("/profile");
  redirect(`/markets/${marketId}?success=Apuesta cancelada`);
}

export async function resolveMarketAction(formData: FormData) {
  const auth = await getAuthContext(true);

  if (!isAdminEmail(auth!.email)) {
    redirect("/admin?error=No autorizado");
  }

  const marketId = getString(formData, "market_id");
  const outcome = getString(formData, "outcome");
  const notes = getString(formData, "notes");

  if (!marketId || !["yes", "no"].includes(outcome)) {
    redirect("/admin?error=Datos de resolución inválidos");
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
  redirect("/admin?success=Mercado resuelto");
}
