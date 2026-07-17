import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionInput = Database["public"]["Tables"]["transactions"]["Insert"];

export async function addTransaction(
  input: Omit<TransactionInput, "user_id">
): Promise<{ data: Transaction | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("transactions")
    .insert({ ...input, user_id: user.id })
    .select("*")
    .single();

  return { data, error: error?.message ?? null };
}

export async function getTransactions(params?: {
  limit?: number;
  fromDate?: string; // ISO date, inclusive
}): Promise<{ data: Transaction[]; error: string | null }> {
  let query = supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false });

  if (params?.fromDate) query = query.gte("transaction_date", params.fromDate);
  if (params?.limit) query = query.limit(params.limit);

  const { data, error } = await query;
  return { data: data ?? [], error: error?.message ?? null };
}

export async function deleteTransaction(
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  return { error: error?.message ?? null };
}

/**
 * Buckets the last N months of transactions into income/expense/savings
 * totals for the dashboard trend charts. Runs client-side on the already
 * RLS-filtered rows returned for the current user.
 */
export function summarizeMonthly(
  transactions: Transaction[],
  months = 6
): Array<{ month: string; income: number; expense: number; savings: number }> {
  const buckets = new Map<string, { income: number; expense: number }>();

  for (const tx of transactions) {
    const key = tx.transaction_date.slice(0, 7); // YYYY-MM
    const bucket = buckets.get(key) ?? { income: 0, expense: 0 };
    if (tx.transaction_type === "income") bucket.income += tx.amount;
    else bucket.expense += tx.amount;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months)
    .map(([month, { income, expense }]) => ({
      month,
      income,
      expense,
      savings: income - expense,
    }));
}
