"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * Wrap any dashboard page in <ProtectedRoute> to require a session.
 * Unauthenticated users are bounced to /login; the original destination
 * is preserved as a `redirect` query param so login can send them back.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      const redirectTo = encodeURIComponent(window.location.pathname);
      router.replace(`/login?redirect=${redirectTo}`);
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F2]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E8D8A8] border-t-[#166534]" />
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Wrap /login, /register, /forgot-password in <GuestOnlyRoute> so an
 * already-authenticated user is sent straight to the dashboard.
 */
export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || user) return null;

  return <>{children}</>;
}
