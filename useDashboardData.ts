"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getFinancialProfile } from "@/services/financialProfile.service";
import {
  getTransactions,
  summarizeMonthly,
} from "@/services/transactions.service";
import { getLatestAssessment } from "@/services/creditAssessment.service";
import { getLoanApplications } from "@/services/loanApplications.service";
import type { Database } from "@/lib/supabase/types";

type FinancialProfile = Database["public"]["Tables"]["financial_profile"]["Row"];
type CreditAssessment = Database["public"]["Tables"]["credit_assessments"]["Row"];
type LoanApplication = Database["public"]["Tables"]["loan_applications"]["Row"];

interface DashboardData {
  profile: FinancialProfile | null;
  latestAssessment: CreditAssessment | null;
  recentLoanApplications: LoanApplication[];
  monthlyTrend: ReturnType<typeof summarizeMonthly>;
  recentTransactions: Database["public"]["Tables"]["transactions"]["Row"][];
}

export function useDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const [profileRes, txRes, assessmentRes, loansRes] = await Promise.all([
      getFinancialProfile(user.id),
      getTransactions({ limit: 200 }),
      getLatestAssessment(),
      getLoanApplications(),
    ]);

    const firstError =
      profileRes.error || txRes.error || assessmentRes.error || loansRes.error;
    if (firstError) {
      setError(firstError);
      setLoading(false);
      return;
    }

    setData({
      profile: profileRes.data,
      latestAssessment: assessmentRes.data,
      recentLoanApplications: loansRes.data.slice(0, 5),
      monthlyTrend: summarizeMonthly(txRes.data, 6),
      recentTransactions: txRes.data.slice(0, 10),
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
