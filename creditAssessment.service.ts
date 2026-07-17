import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type CreditAssessment = Database["public"]["Tables"]["credit_assessments"]["Row"];

/**
 * Triggers the `generate-credit-assessment` Edge Function, which:
 *  1. Reads the caller's financial_profile + recent transactions (server-side,
 *     using the caller's JWT so RLS still applies).
 *  2. Calls the Gemini API to produce a score/risk/summary.
 *  3. Writes the result into credit_assessments with the service role key.
 * The AI provider key never touches the browser.
 */
export async function generateCreditAssessment(): Promise<{
  data: CreditAssessment | null;
  error: string | null;
}> {
  const { data, error } = await supabase.functions.invoke(
    "generate-credit-assessment",
    { method: "POST" }
  );

  if (error) return { data: null, error: error.message };
  return { data: data as CreditAssessment, error: null };
}

export async function getLatestAssessment(): Promise<{
  data: CreditAssessment | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("credit_assessments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { data, error: error?.message ?? null };
}

export async function getAssessmentHistory(): Promise<{
  data: CreditAssessment[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("credit_assessments")
    .select("*")
    .order("created_at", { ascending: false });

  return { data: data ?? [], error: error?.message ?? null };
}
