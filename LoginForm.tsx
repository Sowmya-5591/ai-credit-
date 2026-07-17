"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export function LoginForm() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error } = await signIn({ email, password });
    setSubmitting(false);

    if (error) {
      setError(error);
      return;
    }

    const redirect = searchParams.get("redirect") ?? "/dashboard";
    router.replace(redirect);
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error);
    // On success, Supabase redirects the browser to /auth/callback itself.
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-[18px] border border-[#E8D8A8] bg-white/90 p-8 shadow-lg backdrop-blur-sm"
    >
      <h1 className="mb-1 text-2xl font-semibold text-[#1F2937]">Welcome back</h1>
      <p className="mb-6 text-sm text-[#4B5563]">
        Log in to your AI Credit+ account.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/10 px-3 py-2 text-sm text-[#DC2626]">
          {error}
        </div>
      )}

      <label className="mb-1 block text-sm font-medium text-[#1F2937]">Email</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4 w-full rounded-xl border border-[#E8D8A8] px-4 py-2.5 outline-none focus:border-[#166534]"
        placeholder="you@example.com"
      />

      <label className="mb-1 block text-sm font-medium text-[#1F2937]">Password</label>
      <input
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-2 w-full rounded-xl border border-[#E8D8A8] px-4 py-2.5 outline-none focus:border-[#166534]"
        placeholder="••••••••"
      />

      <div className="mb-6 text-right">
        <a href="/forgot-password" className="text-sm text-[#166534] hover:underline">
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mb-3 w-full rounded-xl bg-[#166534] py-2.5 font-medium text-white transition hover:bg-[#14532D] disabled:opacity-60"
      >
        {submitting ? "Signing in…" : "Log In"}
      </button>

      <button
        type="button"
        onClick={handleGoogle}
        className="w-full rounded-xl border border-[#E8D8A8] bg-white py-2.5 font-medium text-[#1F2937] transition hover:bg-[#F5DEB3]/30"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-[#4B5563]">
        Don&apos;t have an account?{" "}
        <a href="/register" className="text-[#166534] hover:underline">
          Register
        </a>
      </p>
    </form>
  );
}
