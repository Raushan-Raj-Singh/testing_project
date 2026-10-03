"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, Mail, Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailChange = (val) => {
    setEmail(val);
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Frontend validation
    if (!email || !email.trim()) {
      setErrorMsg("Please enter your email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await res.json();
      if (result.success) {
        setSuccessMsg(
          result.message ||
            "If an account exists for this email, we've sent a password reset link."
        );
      } else {
        setErrorMsg(result.message || "Failed to process request.");
      }
    } catch (err) {
      setErrorMsg("Network connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0b0f17] text-[#f9fafb] selection:bg-[var(--primary)] selection:text-[#0b0f17]">
      {/* Background ambient glow effect */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl border border-[var(--border)] relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="p-3 rounded-2xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] shadow-lg">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--fg)] tracking-tight">
            Forgot Password
          </h1>
          <p className="text-xs text-white font-medium max-w-xs leading-relaxed">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-[var(--red)] text-xs font-semibold animate-in fade-in duration-150 flex items-center justify-between">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert Box */}
        {successMsg ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.3)] text-[var(--green)] text-xs font-semibold flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed text-white">
                <p className="font-bold text-[var(--green)]">Reset Link Sent</p>
                <p>{successMsg}</p>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full py-3 px-4 text-xs font-bold rounded-xl bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--fg)] transition-all flex items-center justify-center gap-2 shadow-md min-h-[44px] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        ) : (
          /* Forgot Password Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="rj@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--primary)] text-[var(--fg)] transition-all min-h-[44px]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 text-xs font-bold rounded-xl bg-[var(--primary)] text-[#0b0f17] hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 min-h-[44px] cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Link */}
        {!successMsg && (
          <div className="mt-6 pt-4 border-t border-[var(--border)]/60 text-center text-xs text-white">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-bold text-[var(--primary)] hover:underline ml-1"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
