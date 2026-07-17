// These types mirror the SQL migrations in supabase/migrations.
// Once your project is live, prefer regenerating this file with:
//   npx supabase gen types typescript --project-id <your-project-ref> > src/lib/supabase/types.ts

export type EmploymentType =
  | "salaried"
  | "self_employed"
  | "gig_worker"
  | "farmer"
  | "msme_owner"
  | "unemployed";

export type RiskLevel = "low" | "medium" | "high";
export type LoanStatus = "pending" | "approved" | "rejected" | "disbursed";
export type TransactionType = "income" | "expense";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          phone_number: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      financial_profile: {
        Row: {
          id: string;
          user_id: string;
          occupation: string | null;
          employment_type: EmploymentType | null;
          monthly_income: number;
          monthly_expenses: number;
          savings: number;
          existing_loans: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["financial_profile"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["financial_profile"]["Row"]>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: TransactionType;
          category: string;
          amount: number;
          transaction_date: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["transactions"]["Row"]> & {
          user_id: string;
          transaction_type: TransactionType;
          category: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
      };
      credit_assessments: {
        Row: {
          id: string;
          user_id: string;
          alternative_credit_score: number;
          risk_level: RiskLevel;
          loan_eligibility: boolean;
          ai_summary: string | null;
          positive_factors: string[];
          negative_factors: string[];
          suggestions: string[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["credit_assessments"]["Row"]> & {
          user_id: string;
          alternative_credit_score: number;
          risk_level: RiskLevel;
        };
        Update: Partial<Database["public"]["Tables"]["credit_assessments"]["Row"]>;
      };
      loan_applications: {
        Row: {
          id: string;
          user_id: string;
          requested_amount: number;
          recommended_amount: number | null;
          interest_rate: number | null;
          tenure_months: number | null;
          status: LoanStatus;
          reason: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["loan_applications"]["Row"]> & {
          user_id: string;
          requested_amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["loan_applications"]["Row"]>;
      };
    };
  };
}
