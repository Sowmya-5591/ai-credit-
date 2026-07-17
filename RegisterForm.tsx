"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

export function RegisterForm() {
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error } = await signUp({
      email,
      password,
      fullName,
      phoneNumber: phone,
    });
    setSubmitting(false);

    if (error) {
      setError(error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="w-full max-w-md rounded-[18px] border border-[#E8D8A8] bg-white/90 p-8 text-center shadow-lg">
        <h2 className="mb-2 text-xl font-semibold text-[#1F2937]">Check your email</h2>
        <p className="text-sm text-[#4B5563]">
          We sent a verification link to <strong>{email}</strong>. Confirm your
          address to activate your account, then log in.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-[18px] border border-[#E8D8A8] bg-white/90 p-8 shadow-lg backdrop-blur-sm"
    >
      <h1 className="mb-1 text-2xl font-semibold text-[#1F2937]">Create your account</h1>
      <p className="mb-6 text-sm text-[#4B5563]">
        Start your AI-powered credit journey.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/10 px-3 py-2 text-sm text-[#DC2626]">
          {error}
        </div>
      )}

      <label className="mb-1 block text-sm font-medium text-[#1F2937]">Full name</label>
      <input
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="mb-4 w-full rounded-xl border border-[#E8D8A8] px-4 py-2.5 outline-none focus:border-[#166534]"
      />

      <label className="mb-1 block text-sm font-medium text-[#1F2937]">Email</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4 w-full rounded-xl border border-[#E8D8A8] px-4 py-2.5 outline-none focus:border-[#166534]"
      />

      <label className="mb-1 block text-sm font-medium text-[#1F2937]">Phone number</label>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="mb-4 w-full rounded-xl border border-[#E8D8A8] px-4 py-2.5 outline-none focus:border-[#166534]"
      />

      <label className="mb-1 block text-sm font-medium text-[#1F2937]">Password</label>
      <input
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4 w-full rounded-xl border border-[#E8D8A8] px-4 py-2.5 outline-none focus:border-[#166534]"
      />

      <label className="mb-1 block text-sm font-medium text-[#1F2937]">
        Confirm password
      </label>
      <input
        type="password"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="mb-6 w-full rounded-xl border border-[#E8D8A8] px-4 py-2.5 outline-none focus:border-[#166534]"
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-[#166534] py-2.5 font-medium text-white transition hover:bg-[#14532D] disabled:opacity-60"
      >
        {submitting ? "Creating account…" : "Register"}
      </button>

      <p className="mt-6 text-center text-sm text-[#4B5563]">
        Already have an account?{" "}
        <a href="/login" className="text-[#166534] hover:underline">
          Log in
        </a>
      </p>
    </form>
  );
}
