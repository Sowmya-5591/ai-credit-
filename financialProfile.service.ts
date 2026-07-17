import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type FinancialProfile = Database["public"]["Tables"]["financial_profile"]["Row"];
type FinancialProfileInput =
  Database["public"]["Tables"]["financial_profile"]["Insert"];

export async function getFinancialProfile(
  userId: string
): Promise<{ data: FinancialProfile | null; error: string | null }> {
  const { data, error } = await supabase
    .from("financial_profile")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return { data, error: error?.message ?? null };
}

/**
 * Upserts the caller's financial profile. `user_id` is always forced to the
 * current session's id (never trust a client-supplied user_id) so RLS's
 * `auth.uid() = user_id` check can never be bypassed.
 */
export async function upsertFinancialProfile(
  input: Omit<FinancialProfileInput, "user_id">
): Promise<{ data: FinancialProfile | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("financial_profile")
    .upsert({ ...input, user_id: user.id }, { onConflict: "user_id" })
    .select("*")
    .single();

  return { data, error: error?.message ?? null };
}
