import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type LoanApplication = Database["public"]["Tables"]["loan_applications"]["Row"];
type LoanApplicationInput =
  Database["public"]["Tables"]["loan_applications"]["Insert"];

export async function applyForLoan(
  input: Omit<LoanApplicationInput, "user_id" | "status">
): Promise<{ data: LoanApplication | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("loan_applications")
    .insert({ ...input, user_id: user.id, status: "pending" })
    .select("*")
    .single();

  return { data, error: error?.message ?? null };
}

export async function getLoanApplications(): Promise<{
  data: LoanApplication[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("loan_applications")
    .select("*")
    .order("created_at", { ascending: false });

  return { data: data ?? [], error: error?.message ?? null };
}
