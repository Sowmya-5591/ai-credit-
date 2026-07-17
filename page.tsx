"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useDashboardData } from "@/hooks/useDashboardData";
import { generateCreditAssessment } from "@/services/creditAssessment.service";
import { useState } from "react";

function DashboardContent() {
  const { data, loading, error, refresh } = useDashboardData();
  const [assessing, setAssessing] = useState(false);
  const [assessError, setAssessError] = useState<string | null>(null);

  async function handleCheckScore() {
    setAssessing(true);
    setAssessError(null);
    const { error } = await generateCreditAssessment();
    setAssessing(false);
    if (error) {
      setAssessError(error);
      return;
    }
    refresh();
  }

  if (loading) {
    return (
      <div className="p-8 text-[#4B5563]">Loading your dashboard…</div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-[#DC2626]">
        Couldn&apos;t load dashboard data: {error}
      </div>
    );
  }

  const score = data?.latestAssessment?.alternative_credit_score;

  return (
    <div className="min-h-screen bg-[#FAF8F2] p-6 md:p-10">
      <h1 className="mb-6 text-2xl font-semibold text-[#1F2937]">Dashboard</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          label="Alternative Credit Score"
          value={score ? String(score) : "—"}
          hint={data?.latestAssessment?.risk_level ?? "No assessment yet"}
        />
        <Card
          label="Monthly Income"
          value={
            data?.profile ? `₹${data.profile.monthly_income.toLocaleString()}` : "—"
          }
        />
        <Card
          label="Monthly Expenses"
          value={
            data?.profile ? `₹${data.profile.monthly_expenses.toLocaleString()}` : "—"
          }
        />
        <Card
          label="Loan Applications"
          value={String(data?.recentLoanApplications.length ?? 0)}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={handleCheckScore}
          disabled={assessing || !data?.profile}
          className="rounded-xl bg-[#166534] px-5 py-2.5 font-medium text-white transition hover:bg-[#14532D] disabled:opacity-60"
        >
          {assessing ? "Running AI assessment…" : "Check Credit Score"}
        </button>
      </div>

      {!data?.profile && (
        <p className="mt-2 text-sm text-[#F59E0B]">
          Complete your financial profile first to unlock credit assessments.
        </p>
      )}
      {assessError && (
        <p className="mt-2 text-sm text-[#DC2626]">{assessError}</p>
      )}

      <div className="mt-10 rounded-[18px] border border-[#E8D8A8] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#1F2937]">
          Recent Transactions
        </h2>
        {data?.recentTransactions.length ? (
          <table className="w-full text-left text-sm">
            <thead className="text-[#4B5563]">
              <tr>
                <th className="pb-2">Date</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Type</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.map((tx) => (
                <tr key={tx.id} className="border-t border-[#F5DEB3]">
                  <td className="py-2">{tx.transaction_date}</td>
                  <td className="py-2">{tx.category}</td>
                  <td className="py-2 capitalize">{tx.transaction_type}</td>
                  <td
                    className={`py-2 text-right ${
                      tx.transaction_type === "income"
                        ? "text-[#16A34A]"
                        : "text-[#DC2626]"
                    }`}
                  >
                    ₹{tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-[#4B5563]">
            No transactions yet — upload a bank statement to get started.
          </p>
        )}
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#E8D8A8] bg-white p-5 shadow-sm">
      <p className="text-sm text-[#4B5563]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#166534]">{value}</p>
      {hint && <p className="mt-1 text-xs capitalize text-[#C9A227]">{hint}</p>}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
