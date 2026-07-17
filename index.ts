// Deno Edge Function — deploy with:
//   supabase functions deploy generate-credit-assessment
// Secrets needed (set with `supabase secrets set`):
//   GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// (SUPABASE_URL / ANON_KEY are already injected automatically by the platform.)

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssessmentPayload {
  alternative_credit_score: number;
  risk_level: "low" | "medium" | "high";
  loan_eligibility: boolean;
  ai_summary: string;
  positive_factors: string[];
  negative_factors: string[];
  suggestions: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // Client bound to the CALLER's JWT: any query here still goes through RLS,
    // so this function can only ever see the requesting user's own rows.
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();

    if (userError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const [{ data: profile }, { data: transactions }] = await Promise.all([
      callerClient
        .from("financial_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      callerClient
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false })
        .limit(90),
    ]);

    if (!profile) {
      return json(
        { error: "Complete your financial profile before requesting an assessment." },
        400
      );
    }

    const assessment = await callGemini(profile, transactions ?? []);

    // Service-role client to WRITE the result (bypasses RLS by design —
    // this is the only writer of credit_assessments in the whole system).
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: saved, error: insertError } = await adminClient
      .from("credit_assessments")
      .insert({ user_id: user.id, ...assessment })
      .select("*")
      .single();

    if (insertError) return json({ error: insertError.message }, 500);

    return json(saved, 200);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

async function callGemini(
  // deno-lint-ignore no-explicit-any
  profile: any,
  // deno-lint-ignore no-explicit-any
  transactions: any[]
): Promise<AssessmentPayload> {
  const totalIncome = transactions
    .filter((t) => t.transaction_type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.transaction_type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const prompt = `You are an alternative credit scoring engine for underbanked
individuals, gig workers, farmers, and MSMEs who lack traditional credit
history. Score based on cash-flow stability, not just income level.

Applicant financial profile:
- Occupation: ${profile.occupation ?? "unknown"}
- Employment type: ${profile.employment_type ?? "unknown"}
- Monthly income: ${profile.monthly_income}
- Monthly expenses: ${profile.monthly_expenses}
- Savings: ${profile.savings}
- Existing loans: ${profile.existing_loans}
- Last 90 days transactions: ${transactions.length} records,
  total income ${totalIncome}, total expenses ${totalExpense}

Respond ONLY with a raw JSON object (no markdown, no code fences) matching
exactly this shape:
{
  "alternative_credit_score": <integer 300-900>,
  "risk_level": "low" | "medium" | "high",
  "loan_eligibility": <boolean>,
  "ai_summary": "<2-3 sentence creditworthiness summary>",
  "positive_factors": ["<short factor>", ...],
  "negative_factors": ["<short factor>", ...],
  "suggestions": ["<short actionable suggestion>", ...]
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  const parsed = JSON.parse(text) as AssessmentPayload;

  // Clamp/validate before it ever reaches the DB constraint.
  parsed.alternative_credit_score = Math.max(
    300,
    Math.min(900, Math.round(parsed.alternative_credit_score))
  );
  if (!["low", "medium", "high"].includes(parsed.risk_level)) {
    parsed.risk_level = "medium";
  }

  return parsed;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}
